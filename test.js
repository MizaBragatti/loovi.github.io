const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const response = await axios.get('https://escritoriovirtual.loovi.com.br/');
  const $ = cheerio.load(response.data);
  
  // Extrai o HTML completo
  console.log($.html());
  
  // Ou partes específicas
  const loginForm = $('form').html();
  console.log(loginForm);
  
  // Extrai classes CSS
  const cssLinks = $('link[rel="stylesheet"]');
  cssLinks.each((i, elem) => {
    console.log($(elem).attr('href'));
  });
})();