import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('GamePage')
export class GamePage extends Component {
  onLoad() {
    console.log('[GamePage] onLoad');
  }
}
