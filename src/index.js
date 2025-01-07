import express from 'express';
import { v4 } from 'uuid';

const app = express();
app.use(express.json());

const customers = []

// Middleware
function verificarCpf(req, res, next){
    const { cpf } = req.headers;
    
    const customer = customers.find((customers) => customers.cpf === cpf);
    if(!customer){
        return res.status(400).json({ error:'conta não existe.' })
    } 

    req.customer = customer;

    return next();

}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

app.post('/account', (req, res) => {
    const { cpf, name } = req.body;
    
    const customerAlreadyExist = customers.some(
        (customers) => customers.cpf === cpf
    );

    if (customerAlreadyExist){
        return res.status(400).json({error: 'Usuário já existe!'})
    }

    customers.push({
        cpf,
        name,
        id: v4(),
        statement: []
    });

    return res.status(201).json({ message: 'Conta criada com sucesso!'});

} )

app.get('/statement', verificarCpf, (req, res) => {
    
    const { customer } = req;
    return res.json(customer.statement);
})

app.post('/deposito', verificarCpf, (req, res) => {
    
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        create_date: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return res.status(201).send({message: 'deposito feito!', statementOperation});
})

app.post('/saque', verificarCpf, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return res.status(400).json({ erro: 'dinheiro insuficiente!'})
    }

    const statementOperation = {
        amount,
        create_date: new Date(),
        type: 'debito',
    };

    customer.statement.push(statementOperation);

    return res.status(201).json(statementOperation)
})

app.listen(3232, () => {
    console.log('app rodando.')
});