var valorFipe = 0;
let tipoSeguro = 'Essencial';
var plano = '', html = '', htmlBaixo = '';
var jsonCotacao = {};
var primeiraMensalidadeEssencial = 0;
var totalEssencial = 0;
var totalAnualEssencial = 0;
var primeiraMensalidadeCompleto = 0;
var totalCompleto = 0;
var totalAnualCompleto = 0;

function salvarHistorico(dados) {
    let historico =  obterHistorico()
    historico.unshift(dados); 
    if (historico.length > 10) {
        historico = historico.slice(0, 5);
    }
    localStorage.setItem('historicoCalculos', JSON.stringify(historico));
}

function obterHistorico() {
    return JSON.parse(localStorage.getItem('historicoCalculos')) || [];
}

function deletarHistorico(index) {
    let historico = obterHistorico();
    historico.splice(index, 1);
    localStorage.setItem('historicoCalculos', JSON.stringify(historico));
    mostrarHistorico(); // Recarrega o histórico
}


let kl = (() => {
    class n {
        setObjSession(e, i) {
            const r = JSON.stringify(e);
            sessionStorage.setItem(i, r)
        }
        getObjSession(e) {
            let i = {};
            const r = sessionStorage.getItem(e);
            return r && (i = JSON.parse(r)),
                i
        }
        setStatePlans(e) {
            this.selectedStatePlans = e,
                this.setObjSession(e, "looviStatePlans")
        }
        getStatePlans() {
            let e = this.getObjSession("looviStatePlans");
            return e || (e = this.selectedStatePlans),
                e
        }
        getPlanStateByPlanId(e, i) {
            let r = "";
            return i && (r = e.filter(s => s.idPlano == i)[0]),
                r
        }
        getPlan() {
            let e = this.getObjSession("looviPlan");
            return "undefined" == e && alert(e),
                e || (e = this.selectedPlan),
                e
        }
        setPlan(e = "") {
            let i = this.getState();
            e || (e = this.getPlanId(i));
            let r = this.getStatePlans();
            if (r && r.length > 0) {
                const o = this.getPlanStateByPlanId(r, e);
                o && (this.selectedPlan = o,
                    this.setObjSession(o, "looviPlan"))
            }
        }
        getState() {
            let e = sessionStorage.getItem("looviState");
            return null === e ? e = null : e || (e = this.selectedState),
                e
        }
        getPlanId(e) {
            let i = ""
                , r = this.getOptionAnual();
            return i = this.getOptionSmartCar() ? r ? `ROUBO_FURTO_PT_RAST_ANUAL_${e}` : `ROUBO_FURTO_PT_RAST_${e}` : r ? `ROUBO_FURTO_PT_ANUAL_${e}` : `ROUBO_FURTO_PT_${e}`,
                sessionStorage.setItem("looviPlanId", i),
                i
        }
        getOptionAnual() {
            let e = !!sessionStorage.getItem("looviAnual");
            return sessionStorage.getItem("looviAnual") || (e = this.optionAnual),
                e
        }
        getOptionSmartCar() {
            let e = !!sessionStorage.getItem("looviSmartCar");
            return sessionStorage.getItem("looviSmartCar") || (e = this.optionSmartCar),
                e
        }
        getPlanItem(e, i = "") {
            if (!e || !e.itensPlano)
                return null;
            const o = e.itensPlano.filter(a => a.codigoItem == i);
            return o.length ? o[0] : null
        }
        getAss24hPrice(e) {
            return this.getPlanItem(e, "SRV_ASS24").preco
        }
        getCarroReservaPrice(e) {
            return this.getPlanItem(e, "SRV_CARRO_RESERVA").preco
        }
        getRouboFurtoPrice(e, i) {
            const r = this.getPlanItem(e, "SRV_ROUBO_FURTO");
            return this.getPlanSubItemFipe(i, r, "SRV_FIPE_ROUBO_FURTO").preco
        }
        getPtRouboFurtoPrice(e, i) {
            const r = this.getPlanItem(e, "SRV_PT_ROUBO_FURTO");
            return this.getPlanSubItemFipe(i, r, "SRV_FIPE_PT_ROUBO_FURTO").preco
        }
        getAgravoPrice(e, i) {
            const r = this.getPlanItem(e, "SRV_AGRAVO")
                , o = i
                , s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SUB_AGRAVO" == u.codigoItem);
            if (!s[0])
                return;
            const l = s[0].formularioCategorias.categoriaSubItem;
            if (!l[0])
                return;
            const c = l.filter(u => u.codigoItem == o);
            return c[0] ? c[0].preco : 0
        }
        getServicoLooviPrice(e, i, r) {
            let o = 0;
            const a = this.getPlanItem(e, "SRV_SERVICO_LOOVI")
                , s = this.getPlanSubItemFipe(i, a, "SRV_FIPE_COM_COLISAO")
                , l = this.getPlanSubItemFipe(i, a, "SRV_FIPE_SEM_COLISAO");
            return o = r ? s.preco : l.preco,
                o
        }
        getSegColisaoPrice(e, i) {
            const r = this.getPlanItem(e, "SRV_SEGUROS_LTI")
                , o = `CAT_FIPE_${i}K`
                , s = r.formularioSubItens.subItemPlano.filter(u => "SRV_SEG_COLISAO" == u.codigoItem);
            if (!s[0])
                return 0;
            const l = s[0].formularioCategorias.categoriaSubItem;
            if (!l[0])
                return 0;
            const c = l.filter(u => u.codigoItem == o);
            return c[0] ? c[0].preco : 0
        }
        getPlanSubItemFipe(e, i, r) {
            const o = `CAT_FIPE_${e}K`
                , s = i.formularioSubItens.subItemPlano.filter(u => u.codigoItem == r);
            if (!s[0])
                return;
            const l = s[0].formularioCategorias.categoriaSubItem;
            if (!l[0])
                return;
            const c = l.filter(u => u.codigoItem == o);
            return c[0] ? c[0] : void 0
        }
        getCalcPlanPrice(e, i, r) {
            let o = 0
                , a = [{
                    item: "SRV_ASS24",
                    price: this.getAss24hPrice(e)
                }, {
                    item: "SRV_CARRO_RESERVA",
                    price: this.getCarroReservaPrice(e)
                }, {
                    item: "SRV_ROUBO_FURTO",
                    price: this.getRouboFurtoPrice(e, i)
                }, {
                    item: "SRV_PT_ROUBO_FURTO",
                    price: this.getPtRouboFurtoPrice(e, i)
                }, {
                    item: "SRV_AGRAVO",
                    price: this.getAgravoPrice(e, r.car)
                }, {
                    item: "SRV_SERVICO_LOOVI",
                    price: this.getServicoLooviPrice(e, i, r.colisao)
                }];
            return r.colisao && (a.push({
                item: "SRV_SEG_COLISAO",
                price: this.getSegColisaoPrice(e, i)
            }),
                a.push({
                    item: "SRV_SEG_TERCEIROS",
                    price: this.getSegTerceirosPrice(e)
                }),
                a.push({
                    item: "SRV_SEGUROS_LTI",
                    price: this.getSegLtiPrice(e)
                })),
                r.vidros && a.push({
                    item: "SRV_VIDROS",
                    price: this.getVidrosPrice(e)
                }),
                r.smart && a.push({
                    item: "SRV_SMART_CAR",
                    price: this.getSmartPrice(e)
                }),
                a.forEach(s => {
                    o += s.price
                }
                ),
                o
        }
    }
    return n;
})();

function buscarCotacaoSAP() {
    const url = "https://ticjxjby64.execute-api.us-east-1.amazonaws.com/producao/proxy/v2/SAP";
    const apiKey = "RRcW9gj2tZ6pSVsnbpmKhshpXC3yR9EklCwqQyh0";
    const payload = "eyJ1cmwiOiJodHRwczovL3NhcGlpcy5sb292aS5jb20uYnI6NjAwMDAvcGxhbm8vQXBpL3YxL29idGVyUGxhbm9zUG9yRXN0YWRvL1NQL2FwcCIsIm1ldG9kbyI6IkdFVCIsImhlYWRlcnMiOnsicmVxdWVzdGVyIjoiUG9ydGFsIiwiY290YWNhbyI6IiJ9LCJib2R5Ijp7fX0==";

    fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": apiKey
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            // A resposta é uma string base64 de um JSON
            if (typeof data === "string") {
                const jsonStr = atob(data);
                const resultado = JSON.parse(jsonStr);
                //jsonCotacao = JSON.parse(jsonStr);
                let planService = new kl();
                planService.setStatePlans(resultado);
                planService.setPlan()
                //
                // Exemplo: mostrar resultado em um textarea
                // document.getElementById('dadosFipe').value = JSON.stringify(resultado, null, 2);
            } else {
                
            }
        })
        .catch(error => {
            
        });
}

function copiarClipboard(opcao) {
    var input = '', saida = '';
    switch (opcao) {
        case 1:
            input = document.getElementById('fraseEssencial')
            saida = document.getElementById('copia1')
            break;
        default:
            
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
    let looviFipe = 0;
    //Leve, Colisão, SUV, Util, Vidros

    let valorMensalidade = 0,
        primeiraMensalidadeEssencial = 0,
        primeiraMensalidadeCompleto = 0,
        primeiraMensalidadeSemVidro = 0,
        valorColisao = 0,
        valorVidros = 35.00,
        valorAtivacao = 299.90,
        valorTotal = 0,
        descontoMG = 10;

    if (valorFipe > 0 && valorFipe <= 10000) {
        indice = 0;
        looviFipe = 10;
    }

    if (valorFipe > 10000 && valorFipe <= 20000) {
        indice = 1;
        looviFipe = 20;
    }

    if (valorFipe > 20000 && valorFipe <= 30000) {
        indice = 2;
        looviFipe = 30;
    }

    if (valorFipe > 30000 && valorFipe <= 40000) {
        indice = 3;
        looviFipe = 40;
    }

    if (valorFipe > 40000 && valorFipe <= 50000) {
        indice = 4;
        looviFipe = 50;
    }

    if (valorFipe > 50000 && valorFipe <= 60000) {
        indice = 5;
        looviFipe = 60;
    }

    if (valorFipe > 60000 && valorFipe <= 70000) {
        indice = 6;
        looviFipe = 70; 
    }

    if (valorFipe > 70000 && valorFipe <= 80000) {
        indice = 7;
        looviFipe = 80;
    }

    if (valorFipe > 80000 && valorFipe <= 90000) {
        indice = 8;
        looviFipe = 90; 
    }

    if (valorFipe > 90000 && valorFipe <= 100000) {
        indice = 9;
        looviFipe = 100;
    }

    if (valorFipe > 100000 && valorFipe <= 110000) {
        indice = 10;
        looviFipe = 110;
    }

    if (valorFipe > 110000 && valorFipe <= 120000) {
        indice = 11;
        looviFipe = 120;
    }

    if (valorFipe > 120000 && valorFipe <= 130000) {
        indice = 12;
        looviFipe = 130;
    }

    if (valorFipe > 130000 && valorFipe <= 140000) {
        indice = 13;
        looviFipe = 140;    
    }

    if (valorFipe > 140000 && valorFipe <= 150000) {
        indice = 14;
        looviFipe = 150;
    }

    if (valorFipe > 150000) {
        indice = 14;
        looviFipe = 150;
    }

    // buscarCotacaoSAP();
    // let planService = new kl();
    // //planService.setStatePlans(jsonCotacao);
    // //planService.setPlan()
    // r = {
    //     "car": "CAT_AGRAVO_VEICULO_LEVE",
    //     "colisao": false,
    //     "smart": false,
    //     "vidros": false
    // };
    // e = planService.getPlan();
    // i = looviFipe;

    // valorMensalidade = planService.getCalcPlanPrice(e, i, r);

    valorMensalidade = valoresOutrosEstados[0][indice];
    valorColisao = valoresOutrosEstados[1][indice];

    if (document.getElementById('suv').checked) {
        valorMensalidade = valorMensalidade + valoresOutrosEstados[2];
        
    }

    if (document.getElementById('util').checked) {
        valorMensalidade = valorMensalidade + valoresOutrosEstados[3];
        
    }

    if (document.getElementById('sul').checked) {
        valorMensalidade = valoresSul[0][indice];
        valorColisao = valoresSul[1][indice];
        valorVidros = valoresSul[4];

        if (document.getElementById('suv').checked) {
            valorMensalidade = valorMensalidade + valoresSul[2];
            
        }

        if (document.getElementById('util').checked) {
            valorMensalidade = valorMensalidade + valoresSul[3];
            
        }
    }

    if (document.getElementById('mg').checked) {
        valorMensalidade = valoresMG[0][indice];
        valorColisao = valoresMG[1][indice];
        valorVidros = valoresMG[4];

        if (document.getElementById('suv').checked) {
            valorMensalidade = valorMensalidade + valoresMG[2];
            
            
            
        }

        if (document.getElementById('util').checked)
            valorMensalidade = valorMensalidade + valoresMG[3];
    }

    if (document.getElementById('rj').checked) {
        valorMensalidade = valoresRJ[0][indice];
        valorColisao = valoresRJ[1][indice];
        valorVidros = valoresRJ[4];

        if (document.getElementById('suv').checked) {
            valorMensalidade = valorMensalidade + valoresRJ[2];
            
        }

        if (document.getElementById('util').checked) {
            valorMensalidade = valorMensalidade + valoresRJ[3];
            
        }
    }

    tipoSeguro = tipoSeguro + ' + vidros';

    document.getElementById('colisaoEssencial').innerHTML = 0;

    //Essencial

    primeiraMensalidadeEssencial = parseFloat((valorMensalidade + valorAtivacao).toFixed(2));
    document.getElementById('primeiraMensalidadeEssencial').innerHTML = formatoBRL(primeiraMensalidadeEssencial);

    totalEssencial = parseFloat((valorMensalidade).toFixed(2));
    document.getElementById('totalEssencial').innerHTML = formatoBRL(totalEssencial);

    totalAnualEssencial = parseFloat(((valorMensalidade * 12) + valorAtivacao).toFixed(2));
    document.getElementById('totalAnualEssencial').innerHTML = formatoBRL(totalAnualEssencial);

    let valorMensalidadeEssencial = ((totalAnualEssencial / 12).toFixed(2));
    document.getElementById('colisaoCompleto').innerHTML = formatoBRL(valorColisao);

    //Sem vidros

    primeiraMensalidadeSemVidro = (valorMensalidade + valorColisao + valorAtivacao).toFixed(2);

    let totalSemVidro = (valorMensalidade + valorColisao).toFixed(2);

    let totalAnualSemVidro = (((valorMensalidade + valorColisao) * 12) + valorAtivacao).toFixed(2);

    valorMensalidadeSemVidro = (totalAnualSemVidro / 12).toFixed(2);

    //Completo

    primeiraMensalidadeCompleto = parseFloat((valorMensalidade + valorColisao + valorVidros + valorAtivacao).toFixed(2));
    document.getElementById('primeiraMensalidadeCompleto').innerHTML = formatoBRL(primeiraMensalidadeCompleto);

    totalCompleto = parseFloat((valorMensalidade + valorColisao + valorVidros).toFixed(2));
    document.getElementById('totalCompleto').innerHTML = formatoBRL(totalCompleto);

    totalAnualCompleto = parseFloat(((valorMensalidade + valorColisao + valorVidros) * 12 + valorAtivacao).toFixed(2));
    document.getElementById('totalAnualCompleto').innerHTML = formatoBRL(totalAnualCompleto);
    valorMensalidadeCompleto = parseFloat((totalAnualCompleto / 12).toFixed(2));

    //Frases
    document.getElementById('fraseEssencial').innerHTML = "Seguro Essencial no Plano Anual é de " +
        formatoBRL(totalAnualEssencial) + " em até 12x sem juros de " + formatoBRL(valorMensalidadeEssencial) + " no cartão de crédito. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeEssencial) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalEssencial) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('fraseSemVidro').innerHTML = "Seguro Completo com Colisão no Plano Anual é de " +
        formatoBRL(totalAnualSemVidro) + " em até 12x sem juros de " + formatoBRL(valorMensalidadeSemVidro) + " no cartão de crédito. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeSemVidro) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalSemVidro) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('fraseCompleto').innerHTML = "Seguro Completo com Colisão e Opcional Vidros " +
        "(faróis, lanternas e retrovisores) no Plano Anual é de " + formatoBRL(totalAnualCompleto) + " em até 12x sem juros de " +
        formatoBRL(valorMensalidadeCompleto) + " no cartão crédito. " +
        "Já no Plano Recorrente Mensal o Valor da entrada é de " + formatoBRL(primeiraMensalidadeCompleto) +
        " no cartão de crédito + mensais sem juros de " + formatoBRL(totalCompleto) +
        " debitando mês a mês no cartão de crédito sem comprometer o valor total do Seguro no limite do seu cartão.";

    document.getElementById('miza').style.display = 'block';
    document.getElementById('sofia').style.display = 'block';
    mostrarElementos();
    document.getElementById('btnSalvar').style.display = 'block';
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

    document.querySelectorAll('textarea').forEach(function (textarea) {
        // Ajusta ao digitar, colar ou mudar valor
        ['input', 'change', 'cut', 'paste', 'drop'].forEach(function (evt) {
            textarea.addEventListener(evt, function () { autoResize(textarea); });
        });
        // Ajusta ao carregar a página
        autoResize(textarea);
    });
}

function formatoBRL(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function buscaValor() {
    let placa = document.getElementById('placa').value;
    let valor = parseInt(placa);

    document.getElementById('dadosFipe').value = "Busca por valor: " + formatoBRL(valor);
    let valorInteiro = parseInt((placa.replace("R$ ", "")).replace(",00", "").replace(".", ""));
    valorFipe = valorInteiro;
    calculaMensalidade();
}

function buscaPlaca() {
    let placa = document.getElementById('placa').value;

    const myInit = {
        method: 'GET'
    };

    const URL = 'https://tsrujo7p82.execute-api.us-east-1.amazonaws.com/producao/placas/v2/dados-atualizados/' + placa

    const myRequest = new Request(URL, myInit);

    fetch(myRequest).then(response => {
        return response.json();
    })
        .then(data => {
            document.getElementById('dadosFipe').value = `
            Ano: ${data.Ano}
            Modelo: ${data.Modelo}
            Fabricante: ${data.Fabricante}
            Tipo Veículo: ${data.TipoVeculo}
            Valor FIPE: ${data.Fipe.Valor}
            `;
            let valor = data.Fipe.Valor;
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

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function mostrarHistorico() {
    const historico = obterHistorico();
    const conteudo = document.getElementById('conteudoHistorico');
    conteudo.innerHTML = '';

    if (historico.length === 0) {
        conteudo.innerHTML = '<p>Nenhum cálculo encontrado no histórico.</p>';
    } else {
        const primeiros5 = historico.slice(0, 5);
        primeiros5.forEach((item, index) => {
            const div = document.createElement('div');
            div.style.border = '1px solid #ccc';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';
            div.innerHTML = `
            <div class= "group-calcular">
                <h3>Cálculo ${index + 1} - ${item.data}</h3><button class="apagar">apagar</button>
                </div>
                <p><strong>Placa/Valor:</strong> ${item.placa}</p>
                <p><strong>Dados FIPE:</strong> ${item.dadosFipe}</p>
                <h4>Plano Essencial</h4>
                <p>Primeira Mensalidade: ${formatoBRL(item.essencial.primeiraMensalidade)}</p>
                <p>Mensal: ${formatoBRL(item.essencial.totalMensal)}</p>
                <p>Total Anual: ${formatoBRL(item.essencial.totalAnual)}</p>
                <h4>Plano Completo</h4>
                <p>Primeira Mensalidade: ${formatoBRL(item.completo.primeiraMensalidade)}</p>
                <p>Mensal: ${formatoBRL(item.completo.totalMensal)}</p>
                <p>Total Anual: ${formatoBRL(item.completo.totalAnual)}</p>
            `;
            conteudo.appendChild(div);
            apagarHistorico(div)
        });
    }

    document.getElementById('modalHistorico').style.display = 'block';

    // Adicionar listener para fechar ao clicar fora
    document.addEventListener('click', fecharHistoricoFora);
}

var apagarHistorico = (div) => {
  var buttonApagar = document.querySelectorAll(".apagar");

  buttonApagar.forEach((button, index) => {
    button.addEventListener("click", () => {
      var dataHistorico = obterHistorico();
      dataHistorico.splice(index, 1);
      localStorage.setItem('historicoCalculos', JSON.stringify(dataHistorico));
      mostrarHistorico(); // Recarrega o histórico para atualizar a exibição
    });
  });
};

function fecharHistorico() {
    document.getElementById('modalHistorico').style.display = 'none';
    document.removeEventListener('click', fecharHistoricoFora);
}

function fecharHistoricoFora(event) {
    const modal = document.getElementById('modalHistorico');
    if (event.target === modal) {
        fecharHistorico();
    }
}

function salvarDados() {
    const dadosHistorico = {
        placa: document.getElementById('placa').value,
        dadosFipe: document.getElementById('dadosFipe').value,
        essencial: {
            primeiraMensalidade: primeiraMensalidadeEssencial,
            totalMensal: totalEssencial,
            totalAnual: totalAnualEssencial
        },
        completo: {
            primeiraMensalidade: primeiraMensalidadeCompleto,
            totalMensal: totalCompleto,
            totalAnual: totalAnualCompleto
        },
        data: new Date().toLocaleString('pt-BR')
    };
    salvarHistorico(dadosHistorico);
    alert('Dados salvos no histórico!');
}

