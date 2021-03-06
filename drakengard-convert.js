const fs = require("fs");
const path = require("path");
let symbols = require('./dgtable');

let arg = process.argv.slice(2);
for (let n = 0; n < arg.length; n++) {
    if (arg[n].slice(-3) == "kps")    kps2json(arg[n]);
    if (arg[n].slice(-4) == "json")   json2kps(arg[n]);
}

function writeMessage(messageString)
{
    let charArray = [];
    for (let n=0; n<messageString.length; n++)
    {
        if (messageString[n] == '<') 
        {
            charArray.push(parseInt(messageString[n+1]+messageString[n+2], 16));
            n+=3;
        }
        else if(messageString[n] != '>') 
        charArray.push(symbols.table.getNameByValue(messageString[n]));
    }    
    
    let messageBuffer = Buffer.from(charArray);
    return messageBuffer;
}

function readMessage (start,end, file)
{
    let stringe = '';
    while (start < end)
    {
        if (symbols.table.getValueByName(file[start].toString()) == undefined) 
            stringe += '<' + file[start].toString(16).padStart(2, '0')+'>';
        else 
            stringe += symbols.table.getValueByName(file[start].toString());
        start++;
    }    
    return stringe;
}

function kps2json(filePath)
{    
    let inputFile = fs.readFileSync(filePath);
    const listStart = inputFile.readUInt32LE(0x14);
    const listCounter = inputFile.readUInt32LE(0x18);
    let messages = [];
    console.log(listCounter);

    for (let i=0; i<listCounter; i++)
    {
        if (i < listCounter-1)
            messages.push(readMessage(inputFile.readUInt32LE(listStart + i*4), inputFile.readUInt32LE(listStart + (i+1)*4), inputFile));
        else
            messages.push(readMessage(inputFile.readUInt32LE(listStart + i*4), inputFile.length, inputFile));
    }

    fs.writeFileSync(filePath + ".json",JSON.stringify(messages, null, 2));
}

function json2kps(filePath)
{
    const inputFile = fs.readFileSync(filePath);
    const messages = JSON.parse(inputFile);
    let headerBuffer = Buffer.from([0x4B, 0x50, 0x53, 0x5F, 0x32, 0x30, 0x30, 0x33, 0x2F, 0x30, 0x32, 0x2F, 0x31, 0x33, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    let subfolderPath = path.join(path.parse(filePath).dir, "edited", path.parse(filePath).name);
    headerBuffer.writeUInt32LE(Object.keys(messages).length, 0x18);
    let listBuffer = Buffer.alloc(Object.keys(messages).length * 4);
    let textBuffer = Buffer.from([]);
    let offset = 0x40 + listBuffer.length;
    for (let i=0; i<Object.keys(messages).length; i++)
    {
        listBuffer.writeUInt32LE(offset,i*4);
        let messageBuffer = writeMessage(messages[i]);
        offset += messageBuffer.length;
        textBuffer = Buffer.concat([textBuffer, messageBuffer]);
    }
    if (!fs.existsSync(path.join(path.parse(filePath).dir, "edited"))){
        fs.mkdirSync(path.join(path.parse(filePath).dir, "edited"));
    }
    fs.writeFileSync(subfolderPath, headerBuffer);
    fs.writeFileSync(subfolderPath, listBuffer, {flag:'a'});
    fs.writeFileSync(subfolderPath, textBuffer, {flag:'a'});
    
}
