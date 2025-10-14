const htmlStyle = "<style>\r\n    @import url(\"https://fonts.googleapis.com/css2?family=Manrope:wght@800&display=swap\");\r\n    @import url(\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap\");\r\n    .hide-doc {\r\n        position: fixed;\r\n        top: -10000px;\r\n        left: -10000px;\r\n    }\r\n    * {\r\n        margin: 0;\r\n        padding: 0;\r\n        list-style: none;\r\n        text-align: none;\r\n        border: none;\r\n        outline: 0;\r\n        box-sizing: border-box;\r\n        text-decoration: none;\r\n    }\r\n    html {\r\n        color: #000;\r\n    }\r\n    header .container {\r\n        background-color: #5a78ff;\r\n        padding: 48px 57px;\r\n    }\r\n    header .container img {\r\n        width: 258px;\r\n        height: 21px;\r\n    }\r\n    .container {\r\n        width: 100%;\r\n        max-width: 795px;\r\n        padding: 0 2rem;\r\n        margin: 0 auto;\r\n    }\r\n    .s-hero .container {\r\n        margin-bottom: 12px;\r\n    }\r\n    .s-hero .container .superior {\r\n        position: relative;\r\n    }\r\n    .s-hero .container .superior .titulo {\r\n        display: flex;\r\n        flex-direction: column;\r\n        gap: 10px;\r\n        width: 450px;\r\n        padding: 13px 15px;\r\n        margin-bottom: 30px;\r\n        height: 72px;\r\n    }\r\n    .s-hero .container .superior .titulo .nome {\r\n        font-family: Poppins;\r\n        font-size: 12px;\r\n        line-height: 12px;\r\n        display: inline-block;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .superior .titulo .dados-pessoais {\r\n        display: flex;\r\n        justify-content: space-between;\r\n    }\r\n    .s-hero .container .superior .titulo .dados-pessoais .dados .t {\r\n        font-family: Poppins;\r\n        font-size: 12px;\r\n        font-weight: 400;\r\n        line-height: 12px;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .superior .titulo .dados-pessoais .dados .dado {\r\n        font-size: 10px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        line-height: 12px;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .superior .caixa {\r\n        position: absolute;\r\n        bottom: 6px;\r\n        right: 0;\r\n        padding: 15px;\r\n        background-color: #f2f2f2;\r\n        width: 250px;\r\n        border-radius: 12px;\r\n        display: flex;\r\n        flex-direction: column;\r\n        justify-content: center;\r\n        align-items: flex-start;\r\n        gap: 8px;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup {\r\n        display: flex;\r\n        flex-direction: column;\r\n        width: 100%;\r\n        gap: 4px;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-assinatura {\r\n        font-size: 10px;\r\n        font-weight: 700;\r\n        color: #000;\r\n        font-family: Poppins;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor {\r\n        display: flex;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor2 {\r\n        display: flex;\r\n        flex-direction: column;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor .valor,\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor2 .valor,\r\n    .s-hero .container .valor-assinatura .top .txt-valor .valor,\r\n    .s-hero .container .valor-assinatura .top .txt-valor2 .valor {\r\n        font-family: Manrope;\r\n        font-size: 20px;\r\n        font-weight: 800;\r\n        margin-right: 2px;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor .mes,\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt-valor2 .mes {\r\n        color: #515151;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        display: flex;\r\n        align-items: flex-end;\r\n    }\r\n    .s-hero .container .dados-executivo .email .email,\r\n    .s-hero .container .dados-executivo .email .nome,\r\n    .s-hero .container .dados-executivo .nome .email,\r\n    .s-hero .container .dados-executivo .nome .nome,\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt,\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo .txt-desc {\r\n        color: #515151;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-sup .txt .preco {\r\n        color: #000;\r\n        font-family: Manrope;\r\n        font-size: 10px;\r\n        font-weight: 800;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf {\r\n        width: 100%;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .dados-cupom .cupom,\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo .dados-cupom .cupom {\r\n        display: flex;\r\n        align-items: center;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .dados-cupom .campanha {\r\n        display: flex;\r\n        justify-content: center;\r\n        align-items: center;\r\n        flex: 1 0 0;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .txt-desc {\r\n        font-family: Poppins;\r\n        color: #515151;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .superior .caixa .btn-contratar {\r\n        display: flex;\r\n        justify-content: center;\r\n        width: 100%;\r\n        color: #fff;\r\n        font-size: 14px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        padding: 10px 50px;\r\n        border-radius: 24px;\r\n        background: #009e23;\r\n        cursor: pointer;\r\n    }\r\n    .s-hero .container .dados-plano {\r\n        display: grid;\r\n        justify-content: space-between;\r\n        margin-bottom: 10px;\r\n        gap: 21px;\r\n    }\r\n    .s-hero .container .dados-plano .direito,\r\n    .s-hero .container .dados-plano .esquerdo {\r\n        display: flex;\r\n        flex-direction: column;\r\n        align-items: flex-start;\r\n        border: 1px solid #9caeff;\r\n        padding: 15px;\r\n        gap: 10px;\r\n        border-radius: 8px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .titulo-plano,\r\n    .s-hero .container .dados-plano .esquerdo .titulo-plano {\r\n        color: #5a78ff;\r\n        font-size: 16px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        letter-spacing: -0.12px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura {\r\n        display: flex;\r\n        flex-direction: column;\r\n        gap: 12px;\r\n        width: 320px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura .tipo-cobertura,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura .tipo-cobertura {\r\n        display: flex;\r\n        gap: 6px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura .tipo-cobertura img,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura .tipo-cobertura img {\r\n        width: 22px;\r\n        height: 22px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura .tipo-cobertura .titulo-cobertura,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura .tipo-cobertura .titulo-cobertura {\r\n        width: 173px;\r\n        font-size: 18px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        letter-spacing: -0.14px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura ul,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura ul {\r\n        display: flex;\r\n        flex-direction: column;\r\n        gap: 8px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura ul li,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura ul li {\r\n        display: flex;\r\n        gap: 8px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura ul li img,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura ul li img {\r\n        width: 15px;\r\n        height: 15px;\r\n    }\r\n    .s-hero .container .dados-plano .direito .obs-cobertura ul li .texto,\r\n    .s-hero .container .dados-plano .esquerdo .obs-cobertura ul li .texto {\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        line-height: 12px;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo {\r\n        display: grid;\r\n        grid-template-columns: repeat(2, 1fr);\r\n        gap: 21px;\r\n        margin-top: 21px;\r\n        margin-bottom: 43px;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .esquerdo .titulo {\r\n        color: #515151;\r\n        font-family: Inter, sans-serif;\r\n        font-size: 16px;\r\n        font-weight: 600;\r\n        line-height: normal;\r\n        margin-bottom: 8px;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .esquerdo ul li {\r\n        display: flex;\r\n        justify-content: space-between;\r\n        align-items: center;\r\n        margin-bottom: 5px;\r\n        padding-bottom: 5px;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .esquerdo ul li:not(:last-child) {\r\n        border-bottom: 1px dashed #d5d5d5;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .esquerdo ul li .mensalidade {\r\n        color: #515151;\r\n        font-family: Inter, sans-serif;\r\n        font-size: 12px;\r\n        font-weight: 400;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .esquerdo ul li .preco {\r\n        color: #515151;\r\n        text-align: right;\r\n        font-family: Manrope, sans-serif;\r\n        font-size: 14px;\r\n        font-weight: 600;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top {\r\n        display: flex;\r\n        padding: 8px 16px;\r\n        justify-content: space-between;\r\n        align-items: center;\r\n        background: rgba(90, 120, 255, 0.12);\r\n        border-radius: 10px;\r\n        margin-bottom: 5px;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .titulo-valor-assinatura {\r\n        color: #000;\r\n        font-family: Poppins;\r\n        font-size: 13px;\r\n        font-weight: 400;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor,\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor2 {\r\n        display: flex;\r\n        gap: 5px;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor .valor,\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor2 .valor {\r\n        color: var(--color-black, #000);\r\n        font-family: Manrope;\r\n        font-size: 21.244px;\r\n        font-weight: 700;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor .mes,\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .top .txt-valor2 .mes {\r\n        display: flex;\r\n        align-items: end;\r\n        color: #000;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        line-height: normal;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .titulo-ativacao,\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .titulo-ativacao {\r\n        color: #515151;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        text-align: right;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .titulo-ativacao span,\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .titulo-ativacao span {\r\n        font-family: Manrope;\r\n        font-size: 12px;\r\n        font-weight: 600;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .btn {\r\n        display: flex;\r\n        justify-content: flex-end;\r\n    }\r\n    .s-hero .container .valor-assinatura-recorrente .conteudo .direito .btn .btn-contratar {\r\n        display: flex;\r\n        justify-content: center;\r\n        width: 188px;\r\n        color: #fff;\r\n        font-size: 14px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        padding: 10px 50px;\r\n        border-radius: 24px;\r\n        background: #009e23;\r\n        cursor: pointer;\r\n        margin-top: 10px;\r\n    }\r\n    .s-hero .container .valor-assinatura {\r\n        display: flex;\r\n        flex-direction: column;\r\n        gap: 10px;\r\n        margin-bottom: 10px;\r\n    }\r\n    .s-hero .container .valor-assinatura .top {\r\n        display: flex;\r\n        align-items: center;\r\n        justify-content: space-between;\r\n        padding: 10px 15px;\r\n        border-radius: 8px;\r\n        background: rgba(90, 120, 255, 0.12);\r\n    }\r\n    .s-hero .container .valor-assinatura .top .titulo-valor {\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        color: #000;\r\n    }\r\n    .s-hero .container .valor-assinatura .top .txt-valor,\r\n    .s-hero .container .valor-assinatura .top .txt-valor2 {\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        display: flex;\r\n    }\r\n    .s-hero .container .valor-assinatura .top .txt-valor .mes,\r\n    .s-hero .container .valor-assinatura .top .txt-valor2 .mes {\r\n        color: #000;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        display: flex;\r\n        align-items: end;\r\n        margin-right: 5px;\r\n    }\r\n    .s-hero .container .valor-assinatura .top .txt-valor2 .mes-parcela-unica {\r\n        color: #000;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        display: flex;\r\n        align-items: center;\r\n        margin-right: 5px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom {\r\n        display: flex;\r\n        justify-content: space-between;\r\n        align-items: center;\r\n        height: 106px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo {\r\n        width: 220px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .btn .btn-contratar {\r\n        display: flex;\r\n        justify-content: center;\r\n        width: 100%;\r\n        color: #fff;\r\n        font-size: 14px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n        padding: 10px 50px;\r\n        border-radius: 24px;\r\n        background: #009e23;\r\n        cursor: Poppins;\r\n        margin-top: 10px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix {\r\n        display: flex;\r\n        flex-direction: row;\r\n        gap: 8px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix .conteudo {\r\n        display: flex;\r\n        flex-direction: column;\r\n        justify-content: center;\r\n        gap: 8px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix .conteudo .title {\r\n        color: #000;\r\n        font-family: Poppins, sans-serif;\r\n        font-weight: 700;\r\n        font-size: 11px;\r\n        line-height: 16px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix .conteudo .orientacao {\r\n        width: 256px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix .conteudo .orientacao p {\r\n        color: #515151;\r\n        font-family: Poppins, sans-serif;\r\n        font-size: 9px;\r\n        font-weight: 400;\r\n        line-height: 16px;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .direito .pix img {\r\n        width: 88px;\r\n        height: 88px;\r\n    }\r\n    .s-hero .container .data-proposta {\r\n        display: flex;\r\n        justify-content: end;\r\n        margin-bottom: 8px;\r\n        padding-bottom: 8px;\r\n        border-bottom: 1px solid #e5e5e5;\r\n    }\r\n    .s-hero .container .data-proposta p {\r\n        color: #515151;\r\n        text-align: center;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n    }\r\n    .s-hero .container .dados-executivo {\r\n        display: flex;\r\n        gap: 24px;\r\n        margin-top: 10px;\r\n    }\r\n    .s-hero .container .dados-executivo .email,\r\n    .s-hero .container .dados-executivo .nome {\r\n        width: 200px;\r\n    }\r\n    .s-hero .container .dados-executivo .email .titulo-email,\r\n    .s-hero .container .dados-executivo .email .titulo-executivo,\r\n    .s-hero .container .dados-executivo .nome .titulo-email,\r\n    .s-hero .container .dados-executivo .nome .titulo-executivo {\r\n        color: #000;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 700;\r\n    }\r\n    .footer .container {\r\n        display: flex;\r\n        flex-direction: column;\r\n        background-color: #393c3f;\r\n        padding: 24px 42px;\r\n    }\r\n    .footer .container img {\r\n        display: flex;\r\n        align-items: center;\r\n        margin-bottom: 12px;\r\n        width: 90px;\r\n        height: 15px;\r\n    }\r\n    .footer .container .conteudo {\r\n        display: flex;\r\n        align-items: center;\r\n        gap: 30px;\r\n    }\r\n    .footer .container .conteudo img {\r\n        width: 50px;\r\n        height: 20px;\r\n        display: flex;\r\n        margin: 0 auto;\r\n    }\r\n    .footer .container .conteudo p {\r\n        color: #fff;\r\n        font-family: Poppins;\r\n        font-size: 10px;\r\n        font-weight: 400;\r\n        line-height: 160%;\r\n    }\r\n    .footer .container .conteudo .rede-social {\r\n        display: flex;\r\n        align-items: center;\r\n        gap: 12px;\r\n    }\r\n    .footer .container .conteudo .rede-social img {\r\n        display: flex;\r\n        margin: 0 auto;\r\n        width: 18px;\r\n        height: 18px;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .dados-cupom {\r\n        display: flex;\r\n        gap: 4px;\r\n        margin-bottom: 8px;\r\n        padding-bottom: 8px;\r\n        border-bottom: 1px dashed #d5d5d5;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .dados-cupom .cupom,\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo .dados-cupom .cupom {\r\n        display: flex;\r\n        align-items: center;\r\n        padding: 4px 8px;\r\n        gap: 2px;\r\n        border-radius: 4px;\r\n        background: #999;\r\n        color: #fff;\r\n        font-size: 10px;\r\n        font-family: Poppins;\r\n        font-weight: 700;\r\n    }\r\n    .s-hero .container .superior .caixa .conteudo-inf .dados-cupom .campanha,\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo .dados-cupom .campanha {\r\n        display: flex;\r\n        padding: 3px 4px;\r\n        justify-content: center;\r\n        align-items: center;\r\n        gap: 8px;\r\n        flex: 1 0 0;\r\n        border-radius: 4px;\r\n        color: #515151;\r\n        border: 1px solid #d5d5d5;\r\n        font-size: 10px;\r\n        font-family: Poppins;\r\n        font-weight: 400;\r\n    }\r\n    .s-hero .container .valor-assinatura .bottom .esquerdo .dados-cupom {\r\n        display: flex;\r\n        display: flex;\r\n        gap: 2px;\r\n        margin-bottom: 10px;\r\n        padding-bottom: 10px;\r\n        border-bottom: 1px dashed #d5d5d5;\r\n    }\r\n    .link {\r\n        text-decoration: underline;\r\n        color: #5a78ff;\r\n    }\r\n</style>\r\n";

const htmlHeader =
    "<header _ngcontent-ng-c2012710688=\"\" class=\"head\">\r\n    " +
    "   <div _ngcontent-ng-c2012710688=\"\" class=\"container\">" +
    "       <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/loovi-seguros.svg\" alt=\"\" />" +
    "   </div>\r\n" +
    "</header>";

const htmlBeneficiosInicio = "<div _ngcontent-ng-c2012710688=\"\" class=\"s-hero\">\r\n";
const htmlContainerInicio = "<div _ngcontent-ng-c2012710688=\"\" class=\"container\" style=\"margin-top: 50px;\">\r\n";
const htmlDadosPlanoInicio = "<div _ngcontent-ng-c2012710688=\"\" class=\"dados-plano\" style=\"grid-template-columns: repeat(2, 1fr);\">\r\n"

function htmlEssencial(plano) {
    return "<div _ngcontent-ng-c2012710688=\"\" class=\"esquerdo\">\r\n" +
        "   <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-plano\">Plano " + plano + "</p>\r\n" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"obs-cobertura\">\r\n" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"tipo-cobertura\">\r\n" +
        "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-car-off.svg\" alt=\"\" />\r\n " +
        "           <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-cobertura\">Furto, roubo e perda total</p>\r\n" +
        "       </div>\r\n" +
        "       <ul _ngcontent-ng-c2012710688=\"\">\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n " +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Indenização Integral da Fipe até o limite contratado.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">100% de indenização para Uber, táxi, e entregas.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">70% de indenização para PCD, modificados, rebaixados ou de leilão.</p>\r\n" +
        "           </li>\r\n" +
        "       </ul>\r\n" +
        "   </div>\r\n" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"obs-cobertura\">\r\n" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"tipo-cobertura\">\r\n" +
        "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-car-crane.svg\" alt=\"\" />\r\n" +
        "           <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-cobertura\">Assistência 24h</p>\r\n" +
        "       </div>\r\n" +
        "       <ul _ngcontent-ng-c2012710688=\"\">\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Serviço via 0800.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Reboque até 400km.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Hospedagem para até 5 pessoas.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Chaveiro.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Assistência para panes elétricas e mecânicas.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Auxílio na falta de combustível.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Troca de Pneus em emergências.</p>\r\n" +
        "           </li>\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Recarga para baterias.</p>\r\n" +
        "           </li>\r\n" +
        "       </ul>\r\n" +
        "   </div>\r\n" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"obs-cobertura\">\r\n" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"tipo-cobertura\">\r\n" +
        "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-car-garage.svg\" alt=\"\" />\r\n" +
        "           <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-cobertura\">Carro reserva.</p>\r\n" +
        "       </div>\r\n" +
        "       <ul _ngcontent-ng-c2012710688=\"\">\r\n" +
        "           <li _ngcontent-ng-c2012710688=\"\">\r\n" +
        "               <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
        "               <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Período disponível de 7 dias.</p>\r\n" +
        "           </li>\r\n" +
        "       </ul>\r\n" +
        "   </div>\r\n" +
        "</div>\r\n";
}

const htmlDireitoInicio =
    "<div _ngcontent-ng-c2012710688=\"\"class=\"direito\">\r\n" +
    "   <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-plano\">Adicionais</p>\r\n";

const htmlColisao =
    "<div _ngcontent-ng-c2012710688=\"\" class=\"obs-cobertura\">\r\n" +
    "   <div _ngcontent-ng-c2012710688=\"\" class=\"tipo-cobertura\">\r\n" +
    "       <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-car-off.svg\" alt=\"\" />\r\n" +
    "       <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-cobertura\">Colisão Completa + Terceiros + APP.</p>\r\n" +
    "   </div>\r\n" +
    "   <ul _ngcontent-ng-c2012710688=\"\">\r\n " +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Pagamento integral ou parcial para colisão e fenômenos naturais(alagamento, granizo, incêndio, queda de árvore e suas consequências). Cobertura conforme Tabela FIPE até o limite contratado.</p>\r\n" +
    "       </li>\r\n" +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Cobertura até R$100.000 para danos materiais e até R$100.000 para danos corporais a terceiros em acidentes com outros veículos.</p>\r\n" +
    "       </li>\r\n" +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Indenização de R$10.000 por morte ou invalidez a passageiros, mais reembolso até R$3.000 para despesas hospitalares.</p>\r\n" +
    "       </li>\r\n" +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">\r\nFranquia de 5% para veículos leves nacionais, 8% para transportes profissionais e camionetas, e 10% para veículos importados.\r\n" +
    "               <a _ngcontent-ng-c2012710688=\"\" target=\"_blank\" class=\"link\" href=\"http://gestaorevendas.loovi.com.br/wp-content/uploads/2024/08/LooviTabelaVeiculosImportados.pdf\">(Conforme tabela)</a>\r\n" +
    "           </p>\r\n" +
    "       </li>\r\n" +
    "   </ul>\r\n" +
    "</div>\r\n";

const htmlVidros =
    "<div _ngcontent-ng-c2012710688=\"\" class=\"obs-cobertura\">\r\n" +
    "   <div _ngcontent-ng-c2012710688=\"\" class=\"tipo-cobertura\">\r\n" +
    "       <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/car-windshield-outline.svg\" alt=\"\" />\r\n" +
    "       <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-cobertura\">Vidros completo.</p>\r\n" +
    "   </div>\r\n" +
    "   <ul _ngcontent-ng-c2012710688=\"\">\r\n" +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Cobertura para troca ou reparo.</p>\r\n" +
    "       </li>\r\n" +
    "       <li _ngcontent-ng-c2012710688=\"\">\r\n" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/tabler-icon-check.svg\" alt=\"\" />\r\n" +
    "           <p _ngcontent-ng-c2012710688=\"\" class=\"texto\">Incluso vidros laterais, vidro traseiro, para-brisa, retrovisores, lanternas e faróis.</p>\r\n" +
    "       </li>\r\n" +
    "   </ul>\r\n" +
    "</div>";

const htmlDireitoFim = "</div>";
const htmlDadosPlanoFim = "</div>";

function preencherHTMLBaixo() {
    return htmlBaixo =
        "<div _ngcontent-ng-c2012710688=\"\" class=\"valor-assinatura-recorrente\">\r\n" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"conteudo\">\r\n" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"esquerdo\">\r\n                </div>\r\n" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"direito\">\r\n\r\n" +
        "           <div _ngcontent-ng-c2012710688=\"\" class=\"btn\">" +
        "               <a _ngcontent-ng-c2012710688=\"\"  class=\"btn-contratar\" href=\"" + link + "\" target=\"_blank\">Contratar</a>" +
        "           </div>" +
        "       </div>" +
        "   </div>" +
        "</div>" +
        "<div _ngcontent-ng-c2012710688=\"\" class=\"data-proposta\">" +
        "   <p _ngcontent-ng-c2012710688=\"\">Valido por 3 dias.</p>" +
        "</div>" +
        "<div _ngcontent-ng-c2012710688=\"\" class=\"dados-executivo\">" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"nome\">" +
        "       <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-executivo\">Executivo Loovi:</p>" +
        "       <p _ngcontent-ng-c2012710688=\"\" class=\"nome\">" + nome + "</p>\r\n" +
        "   </div>" +
        "   <div _ngcontent-ng-c2012710688=\"\" class=\"email\">" +
        "       <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-email\">E-mail:</p>" +
        "       <p _ngcontent-ng-c2012710688=\"\" class=\"email\">" + email + "</p>\r\n" +
        "   </div>" +
        "   <a _ngcontent-ng-c2012710688=\"\"  href=\"https://wa.me/55" + tel + "\" target=\"_blank\">" +
        "       <div _ngcontent-ng-c2012710688=\"\" class=\"email\">" +
        "           <p _ngcontent-ng-c2012710688=\"\" class=\"titulo-email\">Telefone:</p>" +
        "           <p _ngcontent-ng-c2012710688=\"\" class=\"email\">" + telFormatado + "</p>" +
        "       </div>" +
        "   </a>" +
        "</div>";
}

const htmlContainerFim = "</div>";

const htmlBeneficiosFim = "</div>";

const htmlFooter =
    "<div _ngcontent-ng-c2012710688=\"\" class=\"footer\">" +
    "   <div _ngcontent-ng-c2012710688=\"\" class=\"container\">" +
    "       <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/logo.svg\" alt=\"\" />" +
    "       <div _ngcontent-ng-c2012710688=\"\" class=\"conteudo\">" +
    "           <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/susep.svg\" alt=\"Logo da Loovi\" />" +
    "           <p _ngcontent-ng-c2012710688=\"\">A LOOVI é uma insurtech que oferece serviços de tecnologia, assistência 24h e produtos de seguros como representante da LTI Seguros S/A (SUSEP n.º 15414.649321/2021-55).</p>" +
    "           <div _ngcontent-ng-c2012710688=\"\" class=\"rede-social\">" +
    "               <a _ngcontent-ng-c2012710688=\"\" href=\"https://www.instagram.com/loovibrasil/\">" +
    "                   <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/instagram.svg\" alt=\"Instagram\" />" +
    "               </a>" +
    "               <a _ngcontent-ng-c2012710688=\"\" href=\"https://www.youtube.com/c/Loovibrasil\">" +
    "                   <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/youtube.svg\" alt=\"Youtube\" />" +
    "               </a>" +
    "               <a _ngcontent-ng-c2012710688=\"\" href=\"https://www.linkedin.com/company/loovibrasil/mycompany/\">" +
    "                   <img _ngcontent-ng-c2012710688=\"\" src=\"https://imagens-assinatura-email.s3.amazonaws.com/teste/linkedin.svg\" alt=\"Linkedin\" />" +
    "               </a>" +
    "           </div>" +
    "       </div>" +
    "   </div>" +
    "</div>";
