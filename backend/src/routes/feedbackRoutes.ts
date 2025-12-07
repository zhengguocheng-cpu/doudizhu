/**
 * 用户反馈路由
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config';

const router = Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.paths.uploads, 'feedback');

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${name}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

/**
 * 提交反馈
 */
router.post('/feedback', upload.array('screenshots', 3), async (req: Request, res: Response) => {
  try {
    const {
      userName,
      feedbackType,
      feedbackContent,
      contact,
      timestamp,
      userAgent,
      url
    } = req.body;
    
    // 验证必填字段
    if (!feedbackContent || !feedbackType) {
      res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
      return;
    }
    
    // 获取上传的文件
    const files = req.files as Express.Multer.File[];
    const screenshots = files ? files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      path: file.path
    })) : [];
    
    // 构建反馈数据
    const now = new Date().toISOString();
    const feedbackId = `FB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const feedback = {
      id: feedbackId,
      userName: userName || '匿名用户',
      feedbackType,
      feedbackContent,
      contact: contact || '',
      screenshots,
      timestamp: timestamp || now,
      userAgent: userAgent || '',
      url: url || '',
      createdAt: now,
      updatedAt: now,
      status: 'pending',          // 默认：待排查
      priority: 'normal',         // 默认优先级
      replies: [] as any[]        // 管理员回复列表
    };
    
    // 保存到文件
    const feedbackDir = config.paths.feedbackData;
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }
    
    const feedbackFile = path.join(feedbackDir, `${feedback.id}.json`);
    fs.writeFileSync(feedbackFile, JSON.stringify(feedback, null, 2));
    
    // 同时追加到汇总文件
    const summaryFile = path.join(feedbackDir, 'all_feedback.jsonl');
    fs.appendFileSync(summaryFile, JSON.stringify(feedback) + '\n');
    
    console.log(`📝 收到用户反馈: ${feedback.id}`);
    console.log(`   用户: ${feedback.userName}`);
    console.log(`   类型: ${feedback.feedbackType}`);
    console.log(`   截图: ${screenshots.length}张`);
    
    res.json({
      success: true,
      message: '反馈提交成功',
      feedbackId: feedback.id
    });
    
  } catch (error) {
    console.error('处理反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 获取反馈列表（管理员用）
 */
router.get('/feedback/list', (req: Request, res: Response) => {
  try {
    const feedbackDir = config.paths.feedbackData;
    
    if (!fs.existsSync(feedbackDir)) {
      res.json({
        success: true,
        feedbacks: []
      });
      return;
    }
    
    const files = fs.readdirSync(feedbackDir)
      .filter(file => file.endsWith('.json') && file !== 'all_feedback.jsonl')
      .sort()
      .reverse();
    
    const feedbacks = files.map(file => {
      const content = fs.readFileSync(path.join(feedbackDir, file), 'utf-8');
      return JSON.parse(content);
    });
    
    res.json({
      success: true,
      feedbacks,
      total: feedbacks.length
    });
    
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 更新反馈状态 / 优先级
 */
router.patch('/feedback/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body as { status?: string; priority?: string };

    const feedbackDir = config.paths.feedbackData;
    const feedbackFile = path.join(feedbackDir, `${id}.json`);

    if (!fs.existsSync(feedbackFile)) {
      res.status(404).json({ success: false, message: '反馈不存在' });
      return;
    }

    const raw = fs.readFileSync(feedbackFile, 'utf-8');
    const data: any = JSON.parse(raw);

    if (typeof status === 'string' && status.trim()) {
      data.status = status.trim();
    }
    if (typeof priority === 'string' && priority.trim()) {
      data.priority = priority.trim();
    }
    data.updatedAt = new Date().toISOString();

    fs.writeFileSync(feedbackFile, JSON.stringify(data, null, 2));

    res.json({ success: true, feedback: data });
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * 管理员对反馈追加回复
 */
router.post('/feedback/:id/reply', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body as { author?: string; content?: string };

    if (!content || !String(content).trim()) {
      res.status(400).json({ success: false, message: '回复内容不能为空' });
      return;
    }

    const feedbackDir = config.paths.feedbackData;
    const feedbackFile = path.join(feedbackDir, `${id}.json`);

    if (!fs.existsSync(feedbackFile)) {
      res.status(404).json({ success: false, message: '反馈不存在' });
      return;
    }

    const raw = fs.readFileSync(feedbackFile, 'utf-8');
    const data: any = JSON.parse(raw);

    const now = new Date().toISOString();
    const reply = {
      id: `R_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      author: (author && String(author).trim()) || '管理员',
      content: String(content).trim(),
      createdAt: now
    };

    if (!Array.isArray(data.replies)) {
      data.replies = [];
    }
    data.replies.push(reply);
    data.updatedAt = now;

    fs.writeFileSync(feedbackFile, JSON.stringify(data, null, 2));

    res.json({ success: true, feedback: data, reply });
  } catch (error) {
    console.error('追加反馈回复失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
