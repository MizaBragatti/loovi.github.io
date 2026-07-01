export class Calcular {
  async buscarCotacaoSAP(estado) {
    const token = localStorage.getItem("idToken");
    const url = `https://pag45vto72.execute-api.us-east-1.amazonaws.com/producao/v1/saphana/plano/Api/v1/obterPlanosPorEstado/${estado.toUpperCase()}/app?_ts=${Date.now()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          requester: "Portal",
          Accept: "application/json",
        },
      });
      return await response.json();
    } catch (error) { }
  }
}
