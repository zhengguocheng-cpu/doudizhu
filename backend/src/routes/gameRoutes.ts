import express from 'express';
import { gameService } from '../services/gameService';
import { ApiResponse, GameRoom } from '../types';

const router = express.Router();

// 获取所有游戏房间
router.get('/rooms', (req, res) => {
  try {
    const rooms = gameService.getAllRooms();
    const response: ApiResponse<GameRoom[]> = {
      success: true,
      data: rooms
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取房间列表失败'
    };
    res.status(500).json(response);
  }
});

// 创建游戏房间
router.post('/rooms', (req, res): void => {
  try {
    const { name, maxPlayers } = req.body;

    if (!name) {
      const response: ApiResponse = {
        success: false,
        error: '房间名称不能为空'
      };
      res.status(400).json(response);
      return;
    }

    const room = gameService.createRoom(name, maxPlayers);
    const response: ApiResponse<GameRoom> = {
      success: true,
      data: room,
      message: '房间创建成功'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '创建房间失败'
    };
    res.status(500).json(response);
  }
});

// 获取指定房间信息
router.get('/rooms/:roomId', (req, res): void => {
  try {
    const { roomId } = req.params;
    const room = gameService.getRoom(roomId);

    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: '房间不存在'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<GameRoom> = {
      success: true,
      data: room
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取房间信息失败'
    };
    res.status(500).json(response);
  }
});

// 玩家加入房间
router.post('/rooms/:roomId/join', (req, res): void => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.body;

    if (!playerName) {
      const response: ApiResponse = {
        success: false,
        error: '玩家名称不能为空'
      };
      res.status(400).json(response);
      return;
    }

    const player = gameService.joinRoom(roomId, playerName);
    const response: ApiResponse = {
      success: true,
      data: player,
      message: '成功加入房间'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '加入房间失败'
    };
    res.status(500).json(response);
  }
});

// 玩家准备
router.post('/rooms/:roomId/ready', (req, res): void => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      const response: ApiResponse = {
        success: false,
        error: '玩家ID不能为空'
      };
      res.status(400).json(response);
      return;
    }

    const success = gameService.playerReady(roomId, playerId);
    const response: ApiResponse = {
      success,
      message: success ? '玩家准备成功' : '玩家准备失败'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '玩家准备失败'
    };
    res.status(500).json(response);
  }
});

export default router;
