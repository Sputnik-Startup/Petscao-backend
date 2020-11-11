import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class ForgotPassMail {
  get key() {
    return 'ForgotPassMail';
  }

  async handle({ data }) {
    const { customer, link } = data;

    await Mail.sendMail({
      to: `${customer.name} <maxwellmacedo2015@gmail.com>`,
      subject: 'Recuperação de conta',
      template: 'forgotpass',
      context: {
        user: customer.name,
        date: format(new Date(), "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
        link,
      },
    });
  }
}

export default new ForgotPassMail();
