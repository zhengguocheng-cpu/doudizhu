import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('LoginPage')
export class LoginPage extends Component {
  onLoad() {
    console.log('[LoginPage] onLoad');
  }
}
