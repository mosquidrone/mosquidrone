exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, orderId, customerName, customerEmail, clips, spot, date } = JSON.parse(event.body);

    const credentials = Buffer.from(
      `${process.env.IZIPAY_USERNAME}:${process.env.IZIPAY_PASSWORD}`
    ).toString('base64');

    const response = await fetch('https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        amount: amount, // en céntimos (6000 = S/60)
        currency: 'PEN',
        orderId: orderId,
        customer: {
          email: customerEmail || 'cliente@mosquidrone.pe',
          billingDetails: {
            firstName: customerName || 'Cliente',
          }
        },
        metadata: {
          clips: clips,
          spot: spot,
          date: date
        }
      })
    });

    const data = await response.json();

    if (data.status === 'SUCCESS') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formToken: data.answer.formToken })
      };
    } else {
      console.error('Izipay error:', data);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Error al crear el pago' })
      };
    }
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno' })
    };
  }
};
