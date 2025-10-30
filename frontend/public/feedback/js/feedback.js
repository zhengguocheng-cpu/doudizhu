/**
 * 用户反馈页面逻辑
 */
class FeedbackManager {
    constructor() {
        this.uploadedFiles = [];
        this.maxFiles = 3;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        
        this.initElements();
        this.bindEvents();
        this.loadUserInfo();
    }
    
    initElements() {
        this.elements = {
            userName: document.getElementById('userName'),
            feedbackContent: document.getElementById('feedbackContent'),
            contact: document.getElementById('contact'),
            charCount: document.getElementById('charCount'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            previewContainer: document.getElementById('previewContainer'),
            submitBtn: document.getElementById('submitBtn'),
            backBtn: document.getElementById('backBtn'),
            messageContainer: document.getElementById('messageContainer')
        };
    }
    
    bindEvents() {
        // 字符计数
        this.elements.feedbackContent.addEventListener('input', () => {
            this.updateCharCount();
        });
        
        // 上传区域点击
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (e.target === this.elements.uploadArea || 
                e.target.classList.contains('upload-placeholder') ||
                e.target.classList.contains('upload-icon') ||
                e.target.classList.contains('upload-text') ||
                e.target.classList.contains('upload-hint')) {
                this.elements.fileInput.click();
            }
        });
        
        // 文件选择
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // 拖拽上传
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });
        
        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });
        
        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // 提交按钮
        this.elements.submitBtn.addEventListener('click', () => {
            this.submitFeedback();
        });
        
        // 返回按钮
        this.elements.backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
    
    loadUserInfo() {
        // 从localStorage加载用户信息
        const userName = localStorage.getItem('userName');
        if (userName) {
            this.elements.userName.value = userName;
        }
    }
    
    updateCharCount() {
        const length = this.elements.feedbackContent.value.length;
        this.elements.charCount.textContent = length;
        
        if (length > 1000) {
            this.elements.charCount.style.color = '#e74c3c';
        } else {
            this.elements.charCount.style.color = '#95a5a6';
        }
    }
    
    handleFiles(files) {
        const fileArray = Array.from(files);
        
        // 检查文件数量
        if (this.uploadedFiles.length + fileArray.length > this.maxFiles) {
            this.showMessage(`最多只能上传 ${this.maxFiles} 张图片`, 'error');
            return;
        }
        
        fileArray.forEach(file => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                this.showMessage(`${file.name} 不是图片文件`, 'error');
                return;
            }
            
            // 检查文件大小
            if (file.size > this.maxFileSize) {
                this.showMessage(`${file.name} 超过 5MB 限制`, 'error');
                return;
            }
            
            this.addFile(file);
        });
    }
    
    addFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const fileData = {
                file: file,
                dataUrl: e.target.result,
                name: file.name
            };
            
            this.uploadedFiles.push(fileData);
            this.renderPreview();
        };
        
        reader.readAsDataURL(file);
    }
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.renderPreview();
    }
    
    renderPreview() {
        if (this.uploadedFiles.length === 0) {
            this.elements.previewContainer.innerHTML = '';
            return;
        }
        
        this.elements.previewContainer.innerHTML = this.uploadedFiles.map((fileData, index) => `
            <div class="preview-item">
                <img src="${fileData.dataUrl}" alt="${fileData.name}" class="preview-image">
                <button class="preview-remove" onclick="feedbackManager.removeFile(${index})">×</button>
            </div>
        `).join('');
    }
    
    async submitFeedback() {
        // 验证表单
        const feedbackType = document.querySelector('input[name="feedbackType"]:checked').value;
        const feedbackContent = this.elements.feedbackContent.value.trim();
        
        if (!feedbackContent) {
            this.showMessage('请填写反馈内容', 'error');
            return;
        }
        
        if (feedbackContent.length > 1000) {
            this.showMessage('反馈内容不能超过1000字', 'error');
            return;
        }
        
        // 禁用提交按钮
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.classList.add('loading');
        
        try {
            // 准备表单数据
            const formData = new FormData();
            formData.append('userName', this.elements.userName.value.trim() || '匿名用户');
            formData.append('feedbackType', feedbackType);
            formData.append('feedbackContent', feedbackContent);
            formData.append('contact', this.elements.contact.value.trim());
            formData.append('timestamp', new Date().toISOString());
            formData.append('userAgent', navigator.userAgent);
            formData.append('url', window.location.href);
            
            // 添加截图
            this.uploadedFiles.forEach((fileData, index) => {
                formData.append('screenshots', fileData.file);
            });
            
            // 发送到服务器
            const response = await fetch('/api/feedback', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showMessage('感谢您的反馈！我们会认真处理', 'success');
                
                // 清空表单
                setTimeout(() => {
                    this.resetForm();
                }, 2000);
            } else {
                throw new Error(result.message || '提交失败');
            }
        } catch (error) {
            console.error('提交反馈失败:', error);
            this.showMessage('提交失败，请稍后重试', 'error');
        } finally {
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.classList.remove('loading');
        }
    }
    
    resetForm() {
        this.elements.feedbackContent.value = '';
        this.elements.contact.value = '';
        this.uploadedFiles = [];
        this.renderPreview();
        this.updateCharCount();
        document.querySelector('input[name="feedbackType"][value="bug"]').checked = true;
    }
    
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        message.innerHTML = `
            <span>${icon}</span>
            <span>${text}</span>
        `;
        
        this.elements.messageContainer.appendChild(message);
        
        // 3秒后自动移除
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
}

// 初始化
let feedbackManager;
document.addEventListener('DOMContentLoaded', () => {
    feedbackManager = new FeedbackManager();
});
