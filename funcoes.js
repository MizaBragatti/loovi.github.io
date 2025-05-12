var valorFipe = 0;
let tipoSeguro = 'Essencial';
var plano = '', html = '', htmlBaixo = '';

function copiarClipboard(opcao) {
    var input = '', saida = '';
    switch (opcao) {
        case 1:
            input = document.getElementById('fraseEssencial')
            saida = document.getElementById('copia1')
            break;
        default:
            console.log('Opção inválida');
    }

    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices

}

function gerarPDF(nomeArquivo) {

    if (nomeArquivo == 'PDF-Essencial') {
        plano = 'Essencial';
        verificarVendedor();
        htmlBaixo = preencherHTMLBaixo();
        html = htmlBeneficiosInicio +
            htmlContainerInicio +
            htmlDadosPlanoInicio + htmlEssencial(plano) + htmlDadosPlanoFim +
            htmlBaixo + htmlContainerFim +
            htmlBeneficiosFim;
    }

    if (nomeArquivo == 'PDF-Completo') {
        plano = 'Completo';
        verificarVendedor();
        htmlBaixo = preencherHTMLBaixo();
        html = htmlBeneficiosInicio + htmlContainerInicio + htmlDadosPlanoInicio + htmlEssencial(plano) +
            htmlDireitoInicio + htmlColisao + htmlVidros + htmlDireitoFim + htmlDadosPlanoFim + htmlBaixo + htmlContainerFim + htmlBeneficiosFim;
    }

    if (nomeArquivo == 'PDF-SemVidros') {
        plano = 'Completo - Sem vidros';
        verificarVendedor();
        htmlBaixo = preencherHTMLBaixo();
        html = htmlBeneficiosInicio + htmlContainerInicio + htmlDadosPlanoInicio + htmlEssencial(plano) +
            htmlDireitoInicio + htmlColisao + htmlDireitoFim + htmlDadosPlanoFim + htmlBaixo + htmlContainerFim + htmlBeneficiosFim;
    }

    const postData = {
        "fileName": nomeArquivo + ".pdf",
        "html": htmlStyle + htmlHeader + html + htmlFooter,
        "options": {
            "landscape": false,
            "displayHeaderFooter": false,
            "marginBottom": 0,
            "marginLeft": 0,
            "marginRight": 0,
            "marginTop": 0,
            "pageRanges": 1,
            "preferCSSPageSize": true
        }
    }

    const jsonData = JSON.stringify(postData);

    const URL = 'https://v2.api2pdf.com/chrome/pdf/html';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': '930cabb8-33e2-4ecc-80bf-f45d4f3173bd'
        },
        body: jsonData
    };

    const myRequest = new Request(URL, options);

    fetch(myRequest).then(response => {
        return response.json();
    })
        .then(data => {
            window.open(data.FileUrl);
        });
}

function verificarPlaca() {
    placa = document.getElementById('placa').value;
    valor = parseInt(placa)
    if (Number.isInteger(valor) && valor > 0) {
        buscaValor();
    } else {
        if (placa.length == 7) {
            buscaPlaca();
        }
    }
}

function calculaMensalidade() {

    let indice = 0;
    //Leve, Colisão, SUV, Util, Vidros

    let valorMensalidade = 0,
        primeiraMensalidadeEssencial = 0,
        primeiraMensalidadeCompleto = 0,
        primeiraMensalidadeSemVidro = 0,
        valorColisao = 0,
        valorVidros = 30.00,
        valorAtivacao = 299.90,
        valorTotal = 0,
        descontoMG = 10;

    if (valorFipe > 0 && valorFipe <= 10000) {
        indice = 0;
    }

    if (valorFipe > 10000 && valorFipe <= 20000) {
        indice = 1;
    }

    if (valorFipe > 20000 && valorFipe <= 30000) {
        indice = 2;
    }

    if (valorFipe > 30000 && valorFipe <= 40000) {
        indice = 3;
    }

    if (valorFipe > 40000 && valorFipe <= 50000) {
        indice = 4;
    }

    if (valorFipe > 50000 && valorFipe <= 60000) {
        indice = 5;
    }

    if (valorFipe > 60000 && valorFipe <= 70000) {
        indice = 6;
    }

    if (valorFipe > 70000 && valorFipe <= 80000) {
        indice = 7;
    }

    if (valorFipe > 80000 && valorFipe <= 90000) {
        indice = 8;
    }

    if (valorFipe > 90000 && valorFipe <= 100000) {
        indice = 9;
    }

    if (valorFipe > 100000 && valorFipe <= 110000) {
        indice = 10;
    }

    if (valorFipe > 110000 && valorFipe <= 120000) {
        indice = 11;
    }

    if (valorFipe > 120000 && valorFipe <= 130000) {
        indice = 12;
    }

    if (valorFipe > 130000 && valorFipe <= 140000) {
        indice = 13;
    }

    if (valorFipe > 140000 && valorFipe <= 150000) {
        indice = 14;
    }

    valorMensalidade = valoresOutrosEstados[0][indice];
    valorColisao = valoresOutrosEstados[1][indice];

    if (document.getElementById('suv').checked) {
        valorMensalidade = valorMensalidade + valoresOutrosEstados[2];
    }

    if (document.getElementById('util').checked) {
        valorMensalidade = valorMensalidade + valoresOutrosEstados[2];
    }

    if (document.getElementById('sul').checked) {
        valorMensalidade = valoresSul[0][indice];
        valorColisao = valoresSul[1][indice];
        valorVidros = valoresSul[4];

        if (document.getElementById('suv').checked)
            valorMensalidade = valorMensalidade + valoresSul[2];

        if (document.getElementById('util').checked)
            valorMensalidade = valorMensalidade + valoresSul[3];
    }

    if (document.getElementById('mg').checked) {
        valorMensalidade = valoresMG[0][indice];
        valorColisao = valoresMG[1][indice];
        valorVidros = valoresMG[4];

        if (document.getElementById('suv').checked)
            valorMensalidade = valorMensalidade + valoresMG[2];

        if (document.getElementById('util').checked)
            valorMensalidade = valorMensalidade + valoresMG[3];
    }

    if (document.getElementById('rj').checked) {
        valorMensalidade = valoresRJ[0][indice];
        valorColisao = valoresRJ[1][indice];
        valorVidros = valoresRJ[4];

        if (document.getElementById('suv').checked)
            valorMensalidade = valorMensalidade + valoresRJ[2];

        if (document.getElementById('util').checked)
            valorMensalidade = valorMensalidade + valoresRJ[3];
    }

    tipoSeguro = tipoSeguro + ' + vidros';

    document.getElementById('colisaoEssencial').innerHTML = 0;

    //Essencial
    valorMensalidadeEssencial = ((valorMensalidade).toFixed(2));
    primeiraMensalidadeEssencial = ((valorMensalidade + valorAtivacao).toFixed(2));
    document.getElementById('primeiraMensalidadeEssencial').innerHTML = formatoBRL(primeiraMensalidadeEssencial);

    let totalEssencial = ((valorMensalidade).toFixed(2));
    document.getElementById('totalEssencial').innerHTML = formatoBRL(totalEssencial);

    let totalAnualEssencial = (((valorMensalidade) * 12) + valorAtivacao).toFixed(2);
    document.getElementById('totalAnualEssencial').innerHTML = formatoBRL(totalAnualEssencial);

    document.getElementById('colisaoCompleto').innerHTML = formatoBRL(valorColisao);

    //Completo
    valorMensalidadeCompleto = (valorMensalidade + valorColisao + valorVidros).toFixed(2);
    primeiraMensalidadeCompleto = (valorMensalidade + valorColisao + valorVidros + valorAtivacao).toFixed(2);
    document.getElementById('primeiraMensalidadeCompleto').innerHTML = formatoBRL(primeiraMensalidadeCompleto);

    let totalCompleto = (valorMensalidade + valorColisao + valorVidros).toFixed(2);
    document.getElementById('totalCompleto').innerHTML = formatoBRL(totalCompleto);

    let totalAnualCompleto = (((valorMensalidade + valorColisao + valorVidros) * 12) + valorAtivacao).toFixed(2);
    document.getElementById('totalAnualCompleto').innerHTML = formatoBRL(totalAnualCompleto);

    //Sem vidros
    valorMensalidadeSemVidro = (valorMensalidade + valorColisao).toFixed(2);
    primeiraMensalidadeSemVidro = (valorMensalidade + valorColisao + valorAtivacao).toFixed(2);

    let totalSemVidro = (valorMensalidade + valorColisao).toFixed(2);

    let totalAnualSemVidro = (((valorMensalidade + valorColisao) * 12) + valorAtivacao).toFixed(2);

    //Frases
    document.getElementById('fraseEssencial').innerHTML = "Seguro Essencial no Plano Anual é de " +
        formatoBRL(totalAnualEssencial) + " em até 12x de " + formatoBRL(valorMensalidadeEssencial) + " no cartão. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeEssencial) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalEssencial) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('fraseCompleto').innerHTML = "Seguro Completo com Colisão no Plano Anual é de " +
        formatoBRL(totalAnualCompleto) + " em até 12x de " + formatoBRL(valorMensalidadeCompleto) + " no cartão. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeCompleto) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalCompleto) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('fraseSemVidro').innerHTML = "Seguro Completo com Colisão e Opcional Vidros " +
        "(faróis, lanternas e retrovisores) no Plano Anual é de " + formatoBRL(totalAnualSemVidro) + " em até 12x de " +
        formatoBRL(valorMensalidadeSemVidro) + " no cartão. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeSemVidro) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalSemVidro) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('miza').style.display = 'block';
    document.getElementById('sofia').style.display = 'block';
    mostrarElementos();
    document.getElementById('btnGerarPDFEssencial').style.display = 'block';
    document.getElementById('btnGerarPDFCompleto').style.display = 'block';
    document.getElementById('btnGerarPDFSemVidros').style.display = 'block';

}

function mostrarElementos() {
    const lbls = document.getElementsByTagName('label');
    const inps = document.getElementsByTagName('input');
    const btns = document.getElementsByTagName('button');
    const txta = document.getElementsByTagName('textarea');

    for (let i = 0; i < lbls.length; i++) {
        lbls[i].style.display = 'inline';
    }

    for (let i = 0; i < inps.length; i++) {
        inps[i].style.display = 'inline';
    }

    for (let i = 0; i < btns.length; i++) {
        btns[i].style.display = 'inline';
    }

    for (let i = 0; i < txta.length; i++) {
        txta[i].style.display = 'inline';
    }


    document.getElementsByTagName('table')[0].style.display = 'table';

}

function formatoBRL(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function buscaValor() {
    let placa = document.getElementById('placa').value;
    let valor = placa;
    document.getElementById('valor').innerHTML = valor;
    let valorInteiro = parseInt((valor.replace("R$ ", "")).replace(",00", "").replace(".", ""));
    valorFipe = valorInteiro;
    calculaMensalidade();
}

function buscaPlaca() {
    let placa = document.getElementById('placa').value;

    //console.log("Placa: " + placa)

    const myInit = {
        method: 'GET'
    };

    const URL = 'https://tsrujo7p82.execute-api.us-east-1.amazonaws.com/producao/placas/v2/dados-atualizados/' + placa

    const myRequest = new Request(URL, myInit);

    fetch(myRequest).then(response => {
        return response.json();
    })
        .then(data => {

            //console.log(valorFipe);
            document.getElementById('ano').innerHTML = data.Ano;
            document.getElementById('modelo').innerHTML = data.Modelo;
            document.getElementById('fabricante').innerHTML = data.Fabricante;
            document.getElementById('tipo').innerHTML = data.TipoVeculo;
            let valor = data.Fipe.Valor;
            document.getElementById('valor').innerHTML = valor;
            let valorInteiro = parseInt((valor.replace("R$ ", "")).replace(",00", "").replace(".", ""));
            valorFipe = valorInteiro;
            calculaMensalidade();
        });
}

let nome, email, telFormatado, tel, link;

function verificarVendedor() {

    nome = 'Eliel Bragatti';
    email = 'eliel.ligea@gmail.com';
    telFormatado = '(11) 933.899.459';
    tel = '11933899459';
    link = 'https://loovi.com.br/27140';

    if (document.getElementById('miza').checked) {
        nome = 'Mizael Bragatti';
        email = 'mizabgt@gmail.com';
        telFormatado = '(11) 980.449.766';
        tel = '11980449766';
        link = 'https://loovi.com.br/45811';
        document.getElementById('util').checked = false;
    }
    if (document.getElementById('sofia').checked) {
        nome = 'Sofia Almeida';
        email = 'sofia.ar37@gmail.com';
        telFormatado = '(11) 990.229.186';
        tel = '11990229186';
        link = 'https://loovi.com.br/25075';
        document.getElementById('util').checked = false;
    }
}