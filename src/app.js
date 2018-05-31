/*jshint esversion: 6 */

const config = require('config');
const log4js = require('log4js');

const configLogs = function() {
  log4js.configure({
    appenders: {
      appLogs: {
        type: 'file',
        filename: 'app.log'
      },
      console: {
        type: 'console'
      }
    },
    categories: {
      default: {
        appenders: config.get('logger.appenders'),
        level: config.get('logger.level.default')
      }
    },
    "replaceConsole": true
  });
}();

const Telegraf = require('telegraf');
const remoteServerBot = require('./remoteServerBot');
const logger = log4js.getLogger("app");
logger.info("running on '" + process.env.NODE_ENV + "' env");
logger.debug("logging lvl set to - " + config.get('logger.level.default'));


logger.info("connecting telegram api");
const bot = new Telegraf(config.get('telegramBot.token'));
bot.use(log4js.connectLogger(log4js.getLogger("http"), {
  level: 'auto'
}));

remoteServerBot.setupRemoteServerBot(bot);


logger.debug("clearing old webhook");
bot.telegram.deleteWebhook().then((success) => {
  if (success) {
    logger.debug("start bot on polling mode");
    let startPolling = (bot, fallbacks = 0) => {
      fallbacks++;
      if (fallbacks < 10) {
        logger.info('restart polling');
        bot.startPolling(30, 100, null, (bot, fallbacks) => {
          startPolling(bot, fallbacks);
        });
      } else {
        logger.error('stop polling due too many tries');
      }
    };
    startPolling(bot);
  } else {
    logger.error("error clearing old webhook");
  }
});
