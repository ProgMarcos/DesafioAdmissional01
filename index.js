const fs = require('fs')
const csvjson = require('csvjson');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const _ = require('lodash');


//função auxiliar do lodash para concatenar os elementos do array
function customizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
}


//função para validar email
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

//função que retorna a primeira palavra da entrada para ser o elemento TYPE
function returnType(obj, index) {
    const maps = Object.entries(obj);
    return (maps[index][0].split(' ')[0]);
}


//função que retorna a primeira e/ou a segunda palavra da entrada para ser o elemento TAG
function returnTag(obj, index) {
    const maps = Object.entries(obj);
    if ((maps[index][0].split(' ').length) > 2) //verifica o tamanho da frase
        return [maps[index][0].split(' ')[1], maps[index][0].split(' ')[2]];
    else
        return [maps[index][0].split(' ')[1]];

}



//retorna o valor dos elementos ADRESS
function returnValue(obj, index) {
    const maps = Object.entries(obj);

    if ((maps[index][0].split(' ')[0]) == 'phone') { //se for um telefone
        try {
            if (phoneUtil.isValidNumberForRegion(phoneUtil.parse(maps[index][1], 'BR'), 'BR')) { //verifica se é um número valido
                const parsephone = phoneUtil.parse(maps[index][1], 'BR') //transforma ele em um numero mais correto
                return "" + parsephone.values_[1] + parsephone.values_[2] //concatena os 2 numeros
            } else {
                return null
            }
        } catch (error) {
            return null
        }
    } else {
        const arr = maps[index][1].split(/[\s/]+/) //divide o email por / ou espaço
        var retorno = []
        if (arr.length > 1) { //caso tenha dividido
            for (let i in arr) {
                if (validateEmail(arr[i])) //valida se é um email
                    retorno.push(arr[i]) //coloca no array
            }
            if (retorno.length > 0)
                return retorno //caso o array nao seja vazio, retorna os emails separados
            else
                return null
        } else {
            if (validateEmail(maps[index][1])) //caso tenha dividido, valida se o valor do email esta correto
                return maps[index][1];
            else
                return null
        }
    }
    // return null
}

function organizer(data) {
    for (let i in data) {
        data[i].addresses = [] //cria o addresses
        data[i].groups = [] //cria o array groups

        data[i].groups.push(data[i].group.split(/[,/]+/))//coloca dentro de groups as salas
        data[i].groups.push(data[i].group1.split(/[,/]+/))

        if ((data[i].invisible == "1") || (data[i].invisible == "yes")) {
            data[i].invisible = true
        } else {
            data[i].invisible = false
        } //define false e true para invisible

        if ((data[i].see_all == "1") || (data[i].see_all == "yes")) {
            data[i].see_all = true
        } else {
            data[i].see_all = false
        } //define false e true para see_all

        for (let k = 0; k < 6; k++) { //for para preencher cada um dos adresses com os tipos definidos
            data[i].addresses[k] = {
                "type": returnType(data[i], k + 2), //utilizando k+2 pois os elementos do endereço começa na 2 posição e termina na 8
                "tags": returnTag(data[i], k + 2),
                "address": returnValue(data[i], k + 2)
            }
        }

        //deleta os elementos que estao com null
        data[i].addresses = data[i].addresses.filter(function (jsonObject) {
            return jsonObject['address'] != null;
        })


        //retira o valor das arrays e coloca dentro da array groups(pai)
        for (let l in data[i].groups) {
            for (let k in data[i].groups[l])
                data[i].groups.push(data[i].groups[l][k])
        }

        //remove os arrays e deixa apenas as strings
            _.remove(data[i].groups, function(n){
                return typeof(n)==typeof([])
            })

            //Retirar espaços das variáveis
            for (let l in data[i].groups){
                data[i].groups[l]=data[i].groups[l].split(" ").join("")
                if(data[i].groups[l]==""){
                    //Retira os que forem vazios
                    data[i].groups.splice(data[i].groups.indexOf(data[i].groups[l]), 1);
                }
                //coloca os espaços entre "sala" e numero
                var index1=data[i].groups[l].slice(0,4)
                var index2=data[i].groups[l].slice(4)
                data[i].groups[l]=index1.concat(' ', index2)
                
            }

            

            //Retira as salas duplicadas
            // console.log(data[0].groups[2])
            
            
            //SEPARAR O NUMERO DA SALA COM O NOME (SALA2 = SALA 2)
            
            
        //deleta os elementos que foram colocados em ADRESSES
        delete data[i]["email Student"]
        delete data[i]["phone Student"]
        delete data[i]["email Pedagogical Responsible"]
        delete data[i]["phone Pedagogical Responsible"]
        delete data[i]["email Financial Responsible"]
        delete data[i]["phone Financial Responsible"]
        delete data[i]["group"]
        delete data[i]["group1"]


    }


    //junta os dois objetos que tem o mesmo id
    for (let i = 0; i < data.length; i++) {
        for (let k = 0; k < data.length; k++) {
            if ((i != k) && (data[i].eid == data[k].eid)) {
                data[i] = _.mergeWith(data[i], data[k], customizer);
                data.splice(k, 1)
            }
        }
    }
    //remove os duplicados no array GROUPS
    for (let i in data){
    data[i].groups = data[i].groups.filter(function(elem, pos, self) {
        return self.indexOf(elem) == pos;
    })}

    return data
}






//---------------------------------------------------------------//
//código principal
const strcsv = fs.readFileSync(('input.csv'), {
    encoding: 'utf8'
});
var split = strcsv.split(',')

for (let i in split) {
    if (split[i] == 'group') {
        split[i] = 'group1'
        break;
    }
}

var resultdata = split.join()

var options = {
    delimiter: ',',
    quote: '"'
};
var objectcsv = csvjson.toObject(resultdata, options);
const result = organizer(objectcsv)
fs.writeFile('output.json', JSON.stringify(result, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log("JSON array is saved.");
});
