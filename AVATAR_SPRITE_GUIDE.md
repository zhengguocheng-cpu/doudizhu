# 头像 Sprite 图使用指南

## 📸 图片准备

### 1. 保存头像图片
将你提供的头像合集图片保存为：
```
frontend-spa/public/imgs/avatars-sprite.png
```

### 2. 图片规格说明
- **布局**：4列 × 4行（共12-15个头像）
- **每个头像区域**：约 256×256px（包含白色圆边）
- **总图片尺寸**：约 1024×1024px

### 3. 头像坐标映射

根据你的图片，头像编号和位置如下：

```
第1行 (y=0):
  avatar-1  (0, 0)      - 法师（蓝色长发）
  avatar-2  (-256, 0)   - 刺客（紫衣双刀）
  avatar-3  (-512, 0)   - 机器人（橙色面罩）
  avatar-4  (-768, 0)   - 预留

第2行 (y=-256):
  avatar-5  (0, -256)   - 战士（棕色斗篷）
  avatar-6  (-256, -256) - 骑士（银甲巨剑）
  avatar-7  (-512, -256) - 狐狸（粉色可爱）
  avatar-8  (-768, -256) - 预留

第3行 (y=-512):
  avatar-9  (0, -512)   - 机械师（绿眼机器人）
  avatar-10 (-256, -512) - 紫衣法师1（紫色火焰）
  avatar-11 (-512, -512) - 紫衣法师2（暗影）
  avatar-12 (-768, -512) - 预留

第4行 (y=-768):
  avatar-13 (0, -768)   - 红发战士（斧头）
  avatar-14 (-256, -768) - 矮人（绿眼护目镜）
  avatar-15 (-512, -768) - 火焰法师（金发火焰）
```

---

## 🎨 CSS 使用方法

### 基础用法
```html
<!-- 显示法师头像 -->
<div class="avatar-sprite avatar-1"></div>

<!-- 显示刺客头像 -->
<div class="avatar-sprite avatar-2"></div>
```

### 不同尺寸
```html
<!-- 大尺寸（120×120px） -->
<div class="avatar-sprite avatar-sprite-large avatar-1"></div>

<!-- 默认尺寸（80×80px） -->
<div class="avatar-sprite avatar-1"></div>

<!-- 小尺寸（48×48px） -->
<div class="avatar-sprite avatar-sprite-small avatar-1"></div>
```

### 选中态
```html
<!-- 选中的头像（金色边框） -->
<div class="avatar-sprite avatar-1 selected"></div>
```

---

## 🔧 在 Profile 页面中使用

### 1. 引入头像选择器组件
```tsx
import AvatarSelector from '@/components/AvatarSelector'
```

### 2. 添加状态和事件处理
```tsx
const [showAvatarSelector, setShowAvatarSelector] = useState(false)
const [currentAvatar, setCurrentAvatar] = useState(1) // 默认头像编号

const handleSelectAvatar = (avatarId: number) => {
  setCurrentAvatar(avatarId)
  // TODO: 调用 API 保存到后端
  console.log('选择了头像:', avatarId)
}
```

### 3. 显示当前头像（可点击更换）
```tsx
<div className="profile-avatar" onClick={() => setShowAvatarSelector(true)}>
  <div className={`avatar-sprite avatar-sprite-large avatar-${currentAvatar}`}></div>
  <div className="avatar-change-hint">点击更换</div>
</div>
```

### 4. 渲染头像选择器弹窗
```tsx
{showAvatarSelector && (
  <AvatarSelector
    currentAvatar={currentAvatar}
    onSelect={handleSelectAvatar}
    onClose={() => setShowAvatarSelector(false)}
  />
)}
```

---

## 🌐 后端 API 集成

### 保存用户头像
```typescript
// 前端调用
const saveAvatar = async (avatarId: number) => {
  const response = await fetch('/api/user/avatar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarId }),
  })
  return response.json()
}
```

### 后端数据库字段
```sql
-- 在 users 表中添加字段
ALTER TABLE users ADD COLUMN avatar_id INT DEFAULT 1;
```

### 显示其他玩家头像
```tsx
// 在玩家列表中
<div className={`avatar-sprite avatar-sprite-small avatar-${player.avatarId}`}></div>
```

---

## 📝 完整示例

### Profile 页面完整代码片段
```tsx
import { useState } from 'react'
import AvatarSelector from '@/components/AvatarSelector'

export default function Profile() {
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState(1)

  const handleSelectAvatar = async (avatarId: number) => {
    setCurrentAvatar(avatarId)
    
    // 保存到后端
    try {
      await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId }),
      })
    } catch (error) {
      console.error('保存头像失败:', error)
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div 
          className="profile-avatar-wrapper"
          onClick={() => setShowAvatarSelector(true)}
        >
          <div className={`avatar-sprite avatar-sprite-large avatar-${currentAvatar}`}></div>
          <div className="avatar-edit-icon">✏️</div>
        </div>
        <div className="profile-info">
          <h2>玩家昵称</h2>
          <p>ID: 123456</p>
        </div>
      </div>

      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={currentAvatar}
          onSelect={handleSelectAvatar}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  )
}
```

---

## 🎯 下一步

1. **保存图片**：将头像合集保存为 `/imgs/avatars-sprite.png`
2. **测试显示**：在浏览器中打开 Profile 页面，点击头像
3. **后端集成**：添加 API 接口保存用户选择的头像编号
4. **全局应用**：在游戏房间、玩家列表等地方使用头像 Sprite

---

## 🔍 调试技巧

如果头像显示不正确：

1. **检查图片路径**：确认 `/imgs/avatars-sprite.png` 存在
2. **检查坐标**：打开浏览器开发者工具，查看 `background-position`
3. **调整 background-size**：如果图片尺寸不是 1024px，需要调整 CSS 中的 `background-size`

```css
/* 如果你的图片是 2048px 宽 */
.avatar-sprite {
  background-size: 2048px auto;
}
```

4. **查看实际尺寸**：
```javascript
const img = new Image()
img.src = '/imgs/avatars-sprite.png'
img.onload = () => {
  console.log('图片尺寸:', img.width, 'x', img.height)
}
```
