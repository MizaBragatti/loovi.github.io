const response = { data: { nome: "João" }, status: undefined };

const { data,...rest} = response;

console.log(rest)



