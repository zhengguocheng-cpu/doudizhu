# 手牌扇形展开功能

## 🎨 功能描述

实现手牌区域的扇形展开效果，类似真实斗地主游戏中的手牌排列方式。

### 效果特点
1. ✅ 卡牌呈扇形排列（中间低，两边高）
2. ✅ 卡牌之间有重叠（节省空间）
3. ✅ 卡牌有旋转角度（形成弧形）
4. ✅ 悬停时卡牌向上弹起并放大
5. ✅ 选中时卡牌向上移动（保持旋转角度）

---

## 📝 实现细节

### 1. CSS样式修改

**文件**: `frontend/public/room/css/room.css`

#### 手牌容器
```css
.player-hand {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: flex-end; /* 底部对齐，形成扇形 */
    height: 100%;
    width: 100%;
    position: relative;
    padding-bottom: 20px; /* 给扇形底部留空间 */
    overflow: visible; /* 允许卡牌超出容器 */
}
```

#### 卡牌样式
```css
.card {
    width: 70px;
    height: 100px;
    position: absolute; /* 绝对定位，用于扇形排列 */
    transform-origin: center bottom; /* 旋转中心点在底部中心 */
    margin-left: -35px; /* 卡牌重叠效果（宽度的一半） */
    transition: all 0.3s ease;
}
```

#### 悬停效果
```css
.card:hover {
    transform: translateY(-20px) scale(1.05) !important;
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
    z-index: 100 !important;
}
```

#### 选中效果
```css
.card.selected {
    border-color: #e74c3c;
    background-color: #ffebee;
    z-index: 50 !important;
}
```

---

### 2. JavaScript逻辑修改

**文件**: `frontend/public/room/js/room-simple.js`

#### 渲染手牌（扇形展开）
```javascript
renderPlayerHand() {
    const container = document.getElementById('playerHand');
    if (!container) return;

    container.innerHTML = '';

    if (!this.playerHand || this.playerHand.length === 0) {
        container.innerHTML = '<div class="no-cards">等待发牌...</div>';
        return;
    }

    const cardCount = this.playerHand.length;
    const maxAngle = 30; // 最大扇形角度（度）
    const overlap = 35; // 卡牌重叠宽度
    
    // 计算扇形参数
    const totalWidth = cardCount * overlap;
    const angleStep = cardCount > 1 ? maxAngle / (cardCount - 1) : 0;
    const startAngle = -maxAngle / 2;
    
    this.playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card;
        cardElement.dataset.index = index;

        // 计算位置和旋转角度
        const angle = startAngle + (angleStep * index);
        const x = index * overlap;
        const y = Math.abs(angle) * 0.5; // 形成弧形
        
        // 应用变换
        cardElement.style.left = `${x}px`;
        cardElement.style.bottom = `${y}px`;
        cardElement.style.transform = `rotate(${angle}deg)`;
        cardElement.style.zIndex = index;

        cardElement.addEventListener('click', () => this.toggleCardSelection(cardElement));
        container.appendChild(cardElement);
    });
}
```

#### 切换卡牌选择（保持旋转角度）
```javascript
toggleCardSelection(cardElement) {
    const isSelected = cardElement.classList.toggle('selected');
    
    // 获取原始的旋转角度
    const currentTransform = cardElement.style.transform;
    const rotateMatch = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
    const angle = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
    
    // 如果选中，在原有旋转基础上向上移动
    if (isSelected) {
        cardElement.style.transform = `rotate(${angle}deg) translateY(-30px)`;
    } else {
        cardElement.style.transform = `rotate(${angle}deg)`;
    }
}
```

---

## 🎯 扇形参数说明

### 关键参数
```javascript
const maxAngle = 30;      // 最大扇形角度（度）
const overlap = 35;       // 卡牌重叠宽度（px）
const cardWidth = 70;     // 卡牌宽度（px）
```

### 计算公式

#### 1. 角度计算
```javascript
angleStep = maxAngle / (cardCount - 1)  // 每张牌的角度间隔
startAngle = -maxAngle / 2              // 起始角度（负数表示向左倾斜）
angle = startAngle + (angleStep * index) // 当前牌的角度
```

**示例**（17张牌）：
- `angleStep = 30 / 16 = 1.875度`
- `startAngle = -15度`
- 第1张牌: `-15度`
- 第9张牌: `0度`（中间，垂直）
- 第17张牌: `+15度`

#### 2. 位置计算
```javascript
x = index * overlap           // X坐标（重叠排列）
y = Math.abs(angle) * 0.5    // Y坐标（形成弧形）
```

**示例**（17张牌）：
- 第1张牌: `x=0, y=7.5px`（左边，稍高）
- 第9张牌: `x=280px, y=0px`（中间，最低）
- 第17张牌: `x=560px, y=7.5px`（右边，稍高）

---

## 📊 视觉效果

### 扇形排列示意图
```
        /  |  \
       /   |   \
      /    |    \
     /     |     \
    /      |      \
   ┌──┐  ┌──┐  ┌──┐
   │♠3│  │♥4│  │♦5│  ...
   └──┘  └──┘  └──┘
   -15°   0°   +15°
```

### 重叠效果
```
┌──┐
│♠3│┌──┐
└──┘│♥4│┌──┐
    └──┘│♦5│
        └──┘
```

### 选中效果
```
    ┌──┐  ← 向上移动30px
    │♥4│  ← 选中的牌
    └──┘
┌──┐    ┌──┐
│♠3│    │♦5│
└──┘    └──┘
```

---

## 🧪 测试步骤

### 1. 刷新浏览器
- 按 `Ctrl + Shift + R` 强制刷新
- 清除缓存

### 2. 进入游戏
1. 3个玩家加入房间
2. 开始游戏
3. 等待发牌

### 3. 观察效果
- ✅ 手牌呈扇形排列
- ✅ 卡牌有旋转角度
- ✅ 卡牌之间有重叠
- ✅ 中间的牌最低，两边的牌稍高

### 4. 交互测试
1. **悬停测试**
   - 鼠标悬停在卡牌上
   - 卡牌应该向上弹起并放大
   - 卡牌应该在最上层

2. **选中测试**
   - 点击卡牌选中
   - 卡牌应该向上移动30px
   - 卡牌应该保持原有的旋转角度
   - 边框变红色，背景变浅红色

3. **取消选中测试**
   - 再次点击已选中的卡牌
   - 卡牌应该回到原位
   - 保持旋转角度

---

## 🎨 参数调整

### 调整扇形角度
```javascript
// 更大的扇形（更明显的弧形）
const maxAngle = 40;

// 更小的扇形（更平直）
const maxAngle = 20;
```

### 调整重叠程度
```javascript
// 更多重叠（更紧凑）
const overlap = 30;

// 更少重叠（更分散）
const overlap = 40;
```

### 调整弧形高度
```javascript
// 更明显的弧形
const y = Math.abs(angle) * 1.0;

// 更平的弧形
const y = Math.abs(angle) * 0.3;
```

---

## 🔍 调试技巧

### 查看卡牌位置
在浏览器控制台：
```javascript
// 查看所有卡牌的位置和角度
document.querySelectorAll('.card').forEach((card, i) => {
    console.log(`卡牌${i}:`, {
        left: card.style.left,
        bottom: card.style.bottom,
        transform: card.style.transform
    });
});
```

### 手动调整参数
```javascript
// 在控制台修改参数后重新渲染
window.roomClient.renderPlayerHand();
```

---

## ⚠️ 注意事项

### 1. 卡牌数量
- 最少3张牌效果明显
- 17-20张牌效果最佳
- 超过25张牌可能需要调整参数

### 2. 屏幕宽度
- 小屏幕可能需要减小 `overlap` 值
- 大屏幕可以增大 `overlap` 值

### 3. 性能
- 使用CSS transform（GPU加速）
- 避免频繁重新渲染

### 4. 兼容性
- 现代浏览器都支持
- IE11可能需要polyfill

---

## 📝 相关文件

### 修改的文件
1. `frontend/public/room/css/room.css`
   - `.player-hand` 样式
   - `.card` 样式
   - `.card:hover` 样式
   - `.card.selected` 样式

2. `frontend/public/room/js/room-simple.js`
   - `renderPlayerHand()` 方法
   - `toggleCardSelection()` 方法

---

## 🎯 效果对比

### 修改前
```
┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│♠3│ │♥4│ │♦5│ │♣6│ │♠7│
└──┘ └──┘ └──┘ └──┘ └──┘
```
- 平铺排列
- 无旋转
- 间距均匀

### 修改后
```
    /  |  |  |  \
   /   |  |  |   \
  /    |  |  |    \
┌──┐┌──┐┌──┐┌──┐┌──┐
│♠3││♥4││♦5││♣6││♠7│
└──┘└──┘└──┘└──┘└──┘
```
- 扇形排列
- 有旋转角度
- 卡牌重叠
- 形成弧形

---

**实现时间**: 2025-10-27 20:03
**功能状态**: ✅ 已实现，待测试验证
