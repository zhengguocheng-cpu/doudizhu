import express from 'express';
import { cardService } from '../services/card/cardService';
import { roomService } from '../services/room/roomService';
import { getPlayerService } from '../services/player/playerService';
import { getGameService } from '../services/game/gameService';
import { gameFacade } from '../services/gameFacade';
import { ApiResponse, GameRoom } from '../types';
import { getUserManager } from '../services/user/userManager';
import { gameRoomsService } from '../services/game/gameRoomsService';
import { socketEventHandler } from '../services/socket/SocketEventHandler';

const router = express.Router();

// 获取所有游戏房间
router.get('/rooms', (req, res) => {
  try {
    // 使用roomService获取房间数据，它包含默认房间
    const rooms = roomService.getAllRooms();
    console.log('API返回房间数量:', rooms.length);
    console.log('房间数据:', rooms.map(r => ({ id: r.id, name: r.name, players: r.players.length })));

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

    const room = roomService.createRoom(name, maxPlayers);
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
    const room = roomService.getRoom(roomId);

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

    const userManager = getUserManager();
    const user = userManager.getUserById(playerName);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: '用户不存在，请先登录'
      };
      res.status(404).json(response);
      return;
    }

    const player = roomService.joinRoom(roomId, playerName);
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

    const success = roomService.togglePlayerReady(roomId, playerId);
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

// // 出牌验证
// router.post('/rooms/:roomId/validate-play', (req, res): void => {
//   try {
//     const { roomId } = req.params;
//     const { playerId, cards } = req.body;

//     if (!playerId || !cards) {
//       const response: ApiResponse = {
//         success: false,
//         error: '玩家ID和出牌信息不能为空'
//       };
//       res.status(400).json(response);
//       return;
//     }

//     const room = roomService.getRoom(roomId);
//     if (!room) {
//       const response: ApiResponse = {
//         success: false,
//         error: '房间不存在'
//       };
//       res.status(404).json(response);
//       return;
//     }

//     // 使用getGameService()验证出牌
//     const validation = getGameService().validateGameOperation(room, 'play_cards', playerId, { cards });
//     const isValid = validation.valid;

//     const response: ApiResponse = {
//       success: isValid,
//       message: isValid ? '出牌有效' : '出牌无效',
//       error: isValid ? undefined : validation.error
//     };
//     res.json(response);
//   } catch (error) {
//     const response: ApiResponse = {
//       success: false,
//       error: '出牌验证失败'
//     };
//     res.status(500).json(response);
//   }
// });

// 获取玩家状态
router.get('/rooms/:roomId/players/:playerId/status', (req, res): void => {
  try {
    const { roomId, playerId } = req.params;
    const room = roomService.getRoom(roomId);

    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: '房间不存在'
      };
      res.status(404).json(response);
      return;
    }

    const player = getPlayerService().getPlayer(room, playerId);
    if (!player) {
      const response: ApiResponse = {
        success: false,
        error: '玩家不存在'
      };
      res.status(404).json(response);
      return;
    }

    const status = getPlayerService().getPlayerStatusDescription(room, playerId);
    const response: ApiResponse = {
      success: true,
      data: {
        player,
        status,
        isReady: getPlayerService().isPlayerReady(room, playerId),
        isLandlord: getPlayerService().isPlayerLandlord(room, playerId),
        isCurrentTurn: getPlayerService().isPlayerCurrentTurn(room, playerId)
      }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取玩家状态失败'
    };
    res.status(500).json(response);
  }
});

// 获取房间玩家列表
router.get('/rooms/:roomId/players', (req, res): void => {
  try {
    const { roomId } = req.params;
    const room = roomService.getRoom(roomId);

    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: '房间不存在'
      };
      res.status(404).json(response);
      return;
    }

    const players = getPlayerService().getRoomPlayers(room);
    const response: ApiResponse = {
      success: true,
      data: players.map((player: any) => ({
        ...player,
        status: getPlayerService().getPlayerStatusDescription(room, player.id)
      }))
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取玩家列表失败'
    };
    res.status(500).json(response);
  }
});

// 获取游戏状态
router.get('/rooms/:roomId/game-state', (req, res): void => {
  try {
    const { roomId } = req.params;
    const gameState = getGameService().getGameState(roomId);

    if (!gameState.success) {
      const response: ApiResponse = {
        success: false,
        error: gameState.error || '获取游戏状态失败'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: gameState.data
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取游戏状态失败'
    };
    res.status(500).json(response);
  }
});

// 开始游戏
router.post('/rooms/:roomId/start', (req, res): void => {
  try {
    const { roomId } = req.params;
    const result = getGameService().startGame(roomId);

    const response: ApiResponse = {
      success: result.success,
      message: result.success ? '游戏开始成功' : '游戏开始失败',
      error: result.error
    };

    if (result.success) {
      // 检查游戏是否结束
      const room = roomService.getRoom(roomId);
      if (room && room.status === 'finished') {
        // 广播游戏结束事件
        socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
          gameFinished: true
        });
      } else {
        // 广播游戏开始事件给所有客户端
        socketEventHandler.broadcastRoomsUpdate('game_started', roomId);
      }

      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '开始游戏失败'
    };
    res.status(500).json(response);
  }
});

// 抢地主
router.post('/rooms/:roomId/grab-landlord', (req, res): void => {
  try {
    const { roomId } = req.params;
    const { playerId, isGrab } = req.body;

    if (!playerId) {
      const response: ApiResponse = {
        success: false,
        error: '玩家ID不能为空'
      };
      res.status(400).json(response);
      return;
    }

    const result = getGameService().handleGrabLandlord(roomId, playerId, isGrab);

    const response: ApiResponse = {
      success: result.success,
      message: result.success ? '抢地主成功' : '抢地主失败',
      error: result.error,
      data: result.gameFinished ? { gameFinished: true } : undefined
    };

    if (result.success) {
      // 检查游戏是否结束
      const room = roomService.getRoom(roomId);
      if (room && room.status === 'finished') {
        // 广播游戏结束事件
        socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
          playerId: playerId,
          isGrab: isGrab,
          gameFinished: true
        });
      } else {
        // 广播抢地主结果给所有客户端
        socketEventHandler.broadcastRoomsUpdate('grab_landlord', roomId, {
          playerId: playerId,
          isGrab: isGrab
        });
      }

      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '抢地主失败'
    };
    res.status(500).json(response);
  }
});

// // 出牌
// router.post('/rooms/:roomId/play-cards', (req, res): void => {
//   try {
//     const { roomId } = req.params;
//     const { playerId, cards } = req.body;

//     if (!playerId || !cards) {
//       const response: ApiResponse = {
//         success: false,
//         error: '玩家ID和出牌信息不能为空'
//       };
//       res.status(400).json(response);
//       return;
//     }

//     const result = getGameService().handlePlayCards(roomId, playerId, cards);

//     const response: ApiResponse = {
//       success: result.success,
//       message: result.success ? '出牌成功' : '出牌失败',
//       error: result.error,
//       data: result.nextPlayer ? { nextPlayer: result.nextPlayer } : undefined
//     };

//     if (result.success) {
//       // 检查游戏是否结束
//       const room = roomService.getRoom(roomId);
//       if (room && room.status === 'finished') {
//         // 广播游戏结束事件
//         socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
//           playerId: playerId,
//           cards: cards,
//           gameFinished: true
//         });
//       } else {
//         // 广播出牌结果给所有客户端
//         socketEventHandler.broadcastRoomsUpdate('play_cards', roomId, {
//           playerId: playerId,
//           cards: cards
//         });
//       }

//       res.status(200).json(response);
//     } else {
//       res.status(400).json(response);
//     }
//   } catch (error) {
//     const response: ApiResponse = {
//       success: false,
//       error: '出牌失败'
//     };
//     res.status(500).json(response);
//   }
// });

// 跳过回合
router.post('/rooms/:roomId/pass-turn', (req, res): void => {
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

    const result = getGameService().handlePassTurn(roomId, playerId);

    const response: ApiResponse = {
      success: result.success,
      message: result.success ? '跳过成功' : '跳过失败',
      error: result.error,
      data: result.nextPlayer ? { nextPlayer: result.nextPlayer } : undefined
    };

    if (result.success) {
      // 广播跳过回合结果给所有客户端
      socketEventHandler.broadcastRoomsUpdate('pass_turn', roomId, {
        playerId: playerId
      });

      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '跳过回合失败'
    };
    res.status(500).json(response);
  }
});

// 获取系统统计信息
router.get('/stats', (req, res): void => {
  try {
    const stats = gameFacade.getSystemStats();
    const response: ApiResponse = {
      success: true,
      data: stats
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取统计信息失败'
    };
    res.status(500).json(response);
  }
});

// 系统健康检查
router.get('/health', (req, res): void => {
  try {
    const health = gameFacade.healthCheck();
    const response: ApiResponse = {
      success: health.healthy,
      data: health,
      message: health.healthy ? '系统运行正常' : '系统存在问题'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '健康检查失败'
    };
    res.status(500).json(response);
  }
});

// 获取游戏快照
router.get('/rooms/:roomId/snapshot', (req, res): void => {
  try {
    const { roomId } = req.params;
    const snapshot = gameFacade.getGameSnapshot(roomId);

    if (!snapshot.success) {
      const response: ApiResponse = {
        success: false,
        error: snapshot.error || '获取游戏快照失败'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: snapshot.snapshot
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: '获取游戏快照失败'
    };
    res.status(500).json(response);
  }
});

// // 通用游戏操作接口
// router.post('/rooms/:roomId/action', (req, res): void => {
//   try {
//     const { roomId } = req.params;
//     const { action, playerId, data } = req.body;

//     if (!action || !playerId) {
//       const response: ApiResponse = {
//         success: false,
//         error: '操作类型和玩家ID不能为空'
//       };
//       res.status(400).json(response);
//       return;
//     }

//     const result = gameFacade.executeGameAction(roomId, action, playerId, data || {});

//     const response: ApiResponse = {
//       success: result.success,
//       message: result.success ? '操作执行成功' : '操作执行失败',
//       error: result.error,
//       data: result.result
//     };

//     if (result.success) {
//       // 检查游戏是否结束
//       const room = roomService.getRoom(roomId);
//       if (room && room.status === 'finished') {
//         // 广播游戏结束事件
//         socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
//           action: action,
//           playerId: playerId,
//           gameFinished: true
//         });
//       } else {
//         // 广播游戏操作结果给所有客户端
//         socketEventHandler.broadcastRoomsUpdate(`action_${action}`, roomId, {
//           action: action,
//           playerId: playerId,
//           data: data
//         });
//       }

//       res.status(200).json(response);
//     } else {
//       res.status(400).json(response);
//     }
//   } catch (error) {
//     const response: ApiResponse = {
//       success: false,
//       error: '执行操作失败'
//     };
//     res.status(500).json(response);
//   }
// });

export default router;
