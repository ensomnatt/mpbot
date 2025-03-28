import { Context } from "telegraf";
import View from "../view/view";

class MessageController {  
  async start(ctx: Context) {
    console.log(`пользователь @${ctx.from?.username} запустил бота`);
    await View.startMessage(ctx);
  }
}

export default MessageController;
