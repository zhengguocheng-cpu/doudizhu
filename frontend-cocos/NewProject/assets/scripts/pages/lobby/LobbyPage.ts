import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('LobbyPage')
export class LobbyPage extends Component {
  onLoad() {
    console.log('[LobbyPage] onLoad');
  }
}
