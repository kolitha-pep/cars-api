const sgMail = require('@sendgrid/mail')
const pug = require('pug');
const path = require('path');
const config = require('config');
const log = require('simple-node-logger').createSimpleLogger();
sgMail.setApiKey(config.SENDGRID_KEY);

/**
 * Email poxy
 */
const emailService = {

  send: async (to, subject, template, data, from = config.DEFAULT_INFO_EMAIL) => {
    
    try {
      const jsonPath = path.join(__dirname, '../views/', template);
      const html = await pug.renderFile(jsonPath, data);
      const msg = {
        to,
        from:{
          email: from,
          name: 'Onemorecar Support'
        },
        subject,
        html,
      };
      return new Promise((resolve, reject) => {
        sgMail.send(msg, (err) => {
          if (err) {
            log.error('emailService send', err);
            resolve({
              status: false,
              msg: err.message,
            });
          } else {
            resolve({
              status: true,
              msg: 'mail sent',
            });
          }
        });
      });
    } catch (error) {
      log.error('emailService send', error);
      return {
        status: false,
        msg: error.message,
      };
    }
  }
}

module.exports = emailService;
