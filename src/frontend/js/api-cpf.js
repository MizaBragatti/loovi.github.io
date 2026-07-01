const cpfValue = "34879141828"
const apiWithCpf = async () => {
    try {
        const url = `https://e2ib2uw05e.execute-api.us-east-1.amazonaws.com/producao/autenticacao/v1/executivo/${cpfValue}`
        const response = await fetch(url)

        const data =  await response.json()
         console.log(data)
        return data
        
    } catch (err) {
        console.error("Error na requisição", err)
    }

}

apiWithCpf()