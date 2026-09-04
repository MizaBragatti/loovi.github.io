-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "agreementNo" INTEGER NOT NULL,
    "contratoNatural" TEXT NOT NULL,
    "bpCode" TEXT NOT NULL,
    "bpName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "slp" TEXT NOT NULL,
    "dataInicioVigencia" TIMESTAMP(3) NOT NULL,
    "dataFimVigencia" TIMESTAMP(3) NOT NULL,
    "idIndicacao" TEXT,
    "idIndicacaoAfiliado" TEXT,
    "placa" TEXT,
    "dataCancelamento" TIMESTAMP(3),
    "telefone" TEXT,
    "email" TEXT,
    "linkApolice" TEXT,
    "inDebito" BOOLEAN NOT NULL,
    "garantiaAtiva" BOOLEAN NOT NULL,
    "valorRecorrencia" DECIMAL(65,30) NOT NULL,
    "tipoPagamento" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_agreementNo_key" ON "Contrato"("agreementNo");
