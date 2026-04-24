exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SHOP_ID = '77823931';
  const PASSWORD = process.env.IZIPAY_PASSWORD;

  if (!PASSWORD) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Credenciales no configuradas' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const { amount, orderId, customerName, clips, spot, date } = body;

  const credentials = Buffer.from(`${SHOP_ID}:${PASSWORD}`).toString('base64');

  const payload = {
    amount,
    currency: 'PEN',
    orderId,
    customer: {
      reference: orderId,
      firstName: customerName || 'Cliente',
    },
    metadata: { clips, spot, date }
  };

  try {
    const res = await fetch('https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.status !== 'SUCCESS') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: data.answer?.errorMessage || 'Error al crear el pago',
          code: data.answer?.errorCode,
          raw: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formToken: data.answer.formToken })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error de conexión con Izipay', detail: err.message })
    };
  }
};
