import { _decorator, Node, tween, Vec3, Color, UIOpacity } from 'cc';

const { ccclass } = _decorator;

/**
 * 动画工具类
 * 提供常用的动画效果
 */
@ccclass('AnimationUtils')
export class AnimationUtils {
    /**
     * 缩放动画
     */
    public static scaleAnimation(node: Node, fromScale: number, toScale: number, duration: number = 0.2): void {
        if (!node || !node.isValid) return;

        node.setScale(fromScale, fromScale, 1);
        tween(node)
            .to(duration, { scale: new Vec3(toScale, toScale, 1) })
            .start();
    }

    /**
     * 弹跳动画
     */
    public static bounceAnimation(node: Node, scale: number = 1.2, duration: number = 0.3): void {
        if (!node || !node.isValid) return;

        const originalScale = node.scale.x;
        tween(node)
            .to(duration * 0.5, { scale: new Vec3(scale, scale, 1) })
            .to(duration * 0.5, { scale: new Vec3(originalScale, originalScale, 1) })
            .start();
    }

    /**
     * 淡入动画
     */
    public static fadeInAnimation(node: Node, duration: number = 0.3): void {
        if (!node || !node.isValid) return;

        const uiOpacity = node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 0;
            tween(uiOpacity)
                .to(duration, { opacity: 255 })
                .start();
        }
    }

    /**
     * 淡出动画
     */
    public static fadeOutAnimation(node: Node, duration: number = 0.3, callback?: () => void): void {
        if (!node || !node.isValid) return;

        const uiOpacity = node.getComponent(UIOpacity);
        if (uiOpacity) {
            tween(uiOpacity)
                .to(duration, { opacity: 0 })
                .call(() => {
                    if (callback) callback();
                })
                .start();
        }
    }

    /**
     * 移动动画
     */
    public static moveAnimation(node: Node, fromPos: Vec3, toPos: Vec3, duration: number = 0.3): void {
        if (!node || !node.isValid) return;

        node.setPosition(fromPos);
        tween(node)
            .to(duration, { position: toPos })
            .start();
    }

    /**
     * 旋转动画
     */
    public static rotateAnimation(node: Node, angle: number, duration: number = 0.3): void {
        if (!node || !node.isValid) return;

        tween(node)
            .to(duration, { eulerAngles: new Vec3(0, 0, angle) })
            .start();
    }

    /**
     * 摇摆动画
     */
    public static shakeAnimation(node: Node, intensity: number = 10, duration: number = 0.5): void {
        if (!node || !node.isValid) return;

        const originalPos = node.position.clone();
        const shakeCount = 10;
        const shakeDuration = duration / shakeCount;

        let currentShake = 0;
        const shake = () => {
            if (currentShake >= shakeCount) {
                node.setPosition(originalPos);
                return;
            }

            const randomX = (Math.random() - 0.5) * intensity;
            const randomY = (Math.random() - 0.5) * intensity;
            
            tween(node)
                .to(shakeDuration, { 
                    position: new Vec3(originalPos.x + randomX, originalPos.y + randomY, originalPos.z) 
                })
                .call(() => {
                    currentShake++;
                    shake();
                })
                .start();
        };

        shake();
    }

    /**
     * 心跳动画
     */
    public static heartbeatAnimation(node: Node, scale: number = 1.1, duration: number = 0.6): void {
        if (!node || !node.isValid) return;

        const originalScale = node.scale.x;
        
        const heartbeat = () => {
            tween(node)
                .to(duration * 0.3, { scale: new Vec3(scale, scale, 1) })
                .to(duration * 0.1, { scale: new Vec3(originalScale, originalScale, 1) })
                .to(duration * 0.3, { scale: new Vec3(scale, scale, 1) })
                .to(duration * 0.3, { scale: new Vec3(originalScale, originalScale, 1) })
                .delay(1.0)
                .call(() => {
                    if (node && node.isValid) {
                        heartbeat();
                    }
                })
                .start();
        };

        heartbeat();
    }

    /**
     * 卡片选择动画
     */
    public static cardSelectAnimation(node: Node, isSelected: boolean, duration: number = 0.2): void {
        if (!node || !node.isValid) return;

        const targetY = isSelected ? 20 : 0;
        const targetScale = isSelected ? 1.1 : 1.0;

        tween(node)
            .parallel(
                tween().to(duration, { position: new Vec3(node.position.x, targetY, node.position.z) }),
                tween().to(duration, { scale: new Vec3(targetScale, targetScale, 1) })
            )
            .start();
    }

    /**
     * 卡片出牌动画
     */
    public static cardPlayAnimation(node: Node, fromPos: Vec3, toPos: Vec3, duration: number = 0.5): void {
        if (!node || !node.isValid) return;

        node.setPosition(fromPos);
        tween(node)
            .to(duration * 0.7, { 
                position: toPos,
                scale: new Vec3(0.8, 0.8, 1)
            })
            .delay(duration * 0.3)
            .to(duration * 0.3, { 
                scale: new Vec3(0, 0, 1)
            })
            .call(() => {
                if (node && node.isValid) {
                    node.destroy();
                }
            })
            .start();
    }

    /**
     * 按钮点击动画
     */
    public static buttonClickAnimation(node: Node, scale: number = 0.95, duration: number = 0.1): void {
        if (!node || !node.isValid) return;

        const originalScale = node.scale.x;
        tween(node)
            .to(duration, { scale: new Vec3(scale, scale, 1) })
            .to(duration, { scale: new Vec3(originalScale, originalScale, 1) })
            .start();
    }

    /**
     * 成功提示动画
     */
    public static successAnimation(node: Node, duration: number = 0.5): void {
        if (!node || !node.isValid) return;

        const originalScale = node.scale.x;
        tween(node)
            .to(duration * 0.3, { scale: new Vec3(1.2, 1.2, 1) })
            .to(duration * 0.7, { scale: new Vec3(originalScale, originalScale, 1) })
            .start();
    }

    /**
     * 错误提示动画
     */
    public static errorAnimation(node: Node, duration: number = 0.5): void {
        if (!node || !node.isValid) return;

        const originalPos = node.position.clone();
        this.shakeAnimation(node, 15, duration);
    }

    /**
     * 加载动画
     */
    public static loadingAnimation(node: Node, duration: number = 1.0): void {
        if (!node || !node.isValid) return;

        const rotate = () => {
            tween(node)
                .to(duration, { eulerAngles: new Vec3(0, 0, 360) })
                .call(() => {
                    if (node && node.isValid) {
                        node.setRotationFromEuler(0, 0, 0);
                        rotate();
                    }
                })
                .start();
        };

        rotate();
    }

    /**
     * 停止所有动画
     */
    public static stopAllAnimations(node: Node): void {
        if (!node || !node.isValid) return;

        tween(node).stop();
    }

    /**
     * 延迟执行
     */
    public static delayCall(node: Node, delay: number, callback: () => void): void {
        if (!node || !node.isValid) return;

        tween(node)
            .delay(delay)
            .call(callback)
            .start();
    }

    /**
     * 序列动画
     */
    public static sequenceAnimation(node: Node, animations: Array<{ duration: number; properties: any }>): void {
        if (!node || !node.isValid) return;

        let tweenChain = tween(node);
        
        animations.forEach(anim => {
            tweenChain = tweenChain.to(anim.duration, anim.properties);
        });
        
        tweenChain.start();
    }

    /**
     * 并行动画
     */
    public static parallelAnimation(node: Node, animations: Array<{ duration: number; properties: any }>): void {
        if (!node || !node.isValid) return;

        const tweens = animations.map(anim => 
            tween().to(anim.duration, anim.properties)
        );
        
        tween(node).parallel(...tweens).start();
    }
}

