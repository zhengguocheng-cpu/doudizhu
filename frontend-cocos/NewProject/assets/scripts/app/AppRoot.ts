import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('AppRoot')
export class AppRoot extends Component {
  onLoad() {
    console.log('[AppRoot] onLoad');
  }
}
