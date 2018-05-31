/*jshint esversion: 6 */

const config = require('config');
const fs = require('fs');
const log4js = require('log4js');

const logger = log4js.getLogger("remoteServerBot");

const managerUsername = "",
      managerChatId = 0;

const getFreeSpaceCmd = 'get_free_space';

const processPath = process.cwd();
// const Path = __dirname;

const START_MSG = '';

module.exports = function() {
  var _bot;
  var botUsername;

  function logError(ctx, err) {
    logger.error(err);
    if (err.stack) {
      logger.error(err.stack);
    }
    if (_bot) {
      _bot.telegram.sendMessage(managerChatId, "#Error: " + err).catch((err) => {
        logger.error('Failed to send error to + ' + managerUsername);
      });
    }
  }

  function handleStartCmd(ctx) {
    logger.debug(ctx.message.text);
    ctx.telegram.sendMessage(ctx.message.chat.id, START_MSG, {parse_mode:'HTML'} );
  }

  function registerManagerCmd(bot, command, func) {
    const authUser = function(ctx, func) {
      let user = {
        username: ctx.message.from.username
      };
      if (user.username !== managerUsername) {
        logger.warn("Unauthorize: " + user.username);
        ctx.reply("Unauthorize");
      } else {
        func(ctx);
      }
    };

    registerCmd(bot, command, (ctx) => authUser(ctx, func));
  }

  function registerCmd(bot, command, func) {
    bot.command('/' + command, (ctx) => func(ctx));
  }

  function setupRemoteServerBot(bot) {
    _bot = bot;
    logger.debug("seting up bot");

    bot.on('error', function (err) {
      logger.error('Ooops - ' + err);
      logError('Ooops', err);
    });

    bot.catch((err) => {
      logger.error('Ooops - ' + err);
      logError('Ooops', err);
    });

    bot.start((ctx) => handleStartCmd(ctx));

    bot.telegram.getMe().then(function(me) {
      bot.options.username = me.username;
      botUsername = me.username;
      logger.info("bot name: " + me.username);
    });

    // registerCmd(bot, Cmd, handleReq);

    registerManagerCmd(bot, getFreeSpaceCmd, handleStartCmd);

  }

  return {
    setupRemoteServerBot
  };
}();
