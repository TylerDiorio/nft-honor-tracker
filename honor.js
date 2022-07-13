// @authors: Oreo | Etherion
//

require('dotenv').config()
const { Web3Provider } = require("@ethersproject/providers");
const Discord = require("discord.js")
const TOKEN = process.env.DISCORD_TOKEN
const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES"
    ]})

var ethers = require('ethers');

///var provider = new ethers.providers.EtherscanProvider();
const provider = ethers.getDefaultProvider("homestead", {etherscan: "77T3FUD38QC3FNID1NR461PA7VG1CER9BF"})

// Contact Address for Voxies NFT
var contactAddressVoxies = 0xE3435EdBf54b5126E817363900234AdFee5B3cee

// Connect to AWS Server for Data Storage
var AWS = require('aws-sdk')

AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})
const docClient = new AWS.DynamoDB.DocumentClient()

// Track time
const isTransactionMined = async (txnHashp) => {
    const txReceipt = await provider.getTransactionReceipt(txnHashp);
    if (txReceipt && txReceipt.blockNumber) {
        return txReceipt
    } else {
        const stc = 0;
        return stc
    }
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)})

client.on('messageCreate', async msg => {
    // BEGIN !reg minor command
    if(msg.content.startsWith("!reg")) {
        // Searches AWS database to check if the user is already registered
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: msg.author.id}
            }
            return docClient.get(params).promise()
        }
        var regc = await getitem();
        if(regc.Item === undefined) {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                    Item: {
                        OreoEtherion: msg.author.id,
                        EtherscanTransactions: [],
                        ETHTotal: [],
                        VOXIESTotal: [],
                        FellowDegens: []
                    }
            }
            docClient.put(params).promise()
            msg.reply(`${msg.author.username} is now registered with Honor-Bot!`)
        } else {
            msg.reply(`${msg.author.username}, it appears you've already registered.`)
        }
    }

    // BEGIN !addWallet medium command
    if(msg.content.startsWith("!addWallets")) {
        //arg parsing here and for loop for any number of args (wallets)
        const args = msg.content.split(' ')
        var arg_Addresses = []
        for(let i = 1; i < args.length; i++) {
            arg_Addresses[i-1] = args[i]
        }
        // Searches AWS database for current user data
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: msg.author.id}
            }
            return docClient.get(params).promise()
        }
        // Search AWS database for global data
        const getitem_global = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: '000000000000000000'}
            }
            return docClient.get(params).promise(); //grabs the data from DynamoDB for the discordID = partition Key               
        } 
        var data = await getitem();
        var data_global = await getitem_global();   
        //Check to make sure there has been something stored in the Global user upon initial construction
        //I don't expect to ever see this msg_global populated as we will always have something in Global
        if(data_global.Item === undefined || data_global.Item === null) {
            msg_global = `[Warning]: There appears to be nothing stored in the Global User. \n` 
            msg_global += `Please alert Oreo or Etherion, as the AWS storage server is acting up.`
            msg.reply(msg_global) }

        // parse the saved addresses from the current user
        let Old_Addresses = data.Item.savedAddresses
        //parse the saved addresses from the global user as a set so we can use the .has method
        let Glob_Addresses = new Set(data_global.Item.savedAddresses)
        // loop through the saved addresses from the current user and check if any of them
        // overlap with the Global_Addresses, which would be a flaggable event
        var overlap_Addresses = []
        let tmp_Addresses = data_global.Item.savedAddresses
        msg_overlap = `[Warning]: The following addresses have already been registered in the database : \n`
        msg_wallet=`${msg.author.username} has added the following addresses: \n`
        counter = 0
        flag = 0
        for(let i = 0; i <arg_Addresses.length; i++) {
            // if this next statement returns `true` then that means this is an address that has
            // already been linked to another user (partition key) as it is present in Glob_Addresses
            if(Glob_Addresses.has(arg_Addresses[i]) === true) {
                overlap_Addresses[i] = arg_Addresses[i]
                msg_overlap += overlap_Addresses[i] + '\n'
                flag += 1
            } 
            // otherwise if you're here that means you found no overlapping string and can add it to global
            else if(Glob_Addresses.has(arg_Addresses[i]) !== true) {
                msg_wallet += arg_Addresses[i] +'\n'
                tmp_Addresses[tmp_Addresses.length + counter] = arg_Addresses[i]
                counter += 1
                Old_Addresses[i] = arg_Addresses[i]
                // see if there is an ENS associated with the valid new address
                Old_AddressENS = await provider.lookupAddress(Old_Addresses[i])
                // also make sure that the ENS isn't just null..
                if(Old_AddressENS !== null) {
                    Old_Addresses[i]=Old_AddressENS //replace the Old_Addresses with an ENS if it exists
                } 
            }
        }
        // These statements shouldn't be necessary because they should only be unique already
        let Total_Addresses = Old_Addresses; //This returns ONLY unique values of tmp_Addresses 
        let Global_Addresses = tmp_Addresses; //This returns ONLY unique values of tmp_Addresses 

        const params = {
            TableName: process.env.AWS_TABLE_NAME,
            Item: {
                OreoEtherion: msg.author.id,
                EtherscanTransactions: data_global.Item.EtherscanTransactions,
                ETHTotal: data_global.Item.ETHTotal,
                VOXIESTotal: data_global.Item.VOXIESTotal,
                FellowDegens: data_global.Item.FellowDegens,
                savedAddresses: Total_Addresses
            }
        }
        const params_global = {
            TableName: process.env.AWS_TABLE_NAME,
            Item: {
                OreoEtherion: '000000000000000000',
                EtherscanTransactions: data.Item.EtherscanTransactions,
                ETHTotal: data.Item.ETHTotal,
                VOXIESTotal: data.Item.VOXIESTotal,
                FellowDegens: data.Item.FellowDegens,
                savedAddresses: Global_Addresses
            }
        }
        await docClient.put(params).promise()
        await docClient.put(params_global).promise()
        if (flag !== 0) {
            msg_wallet+= '\n' + msg_overlap
        }
        msg.reply(msg_wallet) //these need to only be true if the above promises go through
    }

    // BEGIN !getEth minor command
    if(msg.content.startsWith("!getEth")) {
        // Searches AWS database to check if the user is already registered
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: msg.author.id}
            }
            return docClient.get(params).promise()
        }
        var data = await getitem();
        if(data.Item === undefined || data.Item === null) {
            msg_bal = `${msg.author.username}, you are not honored with Honor-Bot`
            msg_bal += `\nPlease type  "!reg" to register`
            msg.reply(msg_bal)
            return
        }
        msg.reply(`${msg.author.username} has logged `+ data.Item.ETHTotal +`ETH in confirmed OTC deals`)
    }

    // BEGIN !getDegens minor command
    if(msg.content.startsWith("!getDegens")) {
        // Searches AWS database to check if the user is already registered
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: msg.author.id}
            }
            return docClient.get(params).promise()
        }
        var data = await getitem();
        if(data.Item === undefined || data.Item === null ) {
            msg_bal = `${msg.author.username}, you are not honored with Honor-Bot`
            msg_bal += `\nPlease type  "!reg" to register`
            msg.reply(msg_bal)
            return
        }        
        msg_deg = (`${msg.author.username} has logged confirmed OTC deals with: \n`)
        if(data.Item.FellowDegens.length <= 1)
            msg_deg = (`${msg.author.username} hasn't logged any confirmed OTC deals\n`)
        msg_deg += `${data.Item.FellowDegens}`
        msg.reply(msg_deg)
    }
    
    // BEGIN !honor Master command
    if(msg.content.startsWith("!honor")) {
        // Initialize some error messages, which we may or may not fill later
        msg_time = ''
        msg_tx = ''
        msg_degens = ''
        msg_value = ''
        // flag will keep track of anything which indicates to reject the Honor
        var flag = 0
        // do some arg parsing and split up the transactions
        const args = msg.content.split(' ')
        if(args.length > 3 || args.length < 3) {
            // Check to see if they've entered the corect number of arguments to !honor (args.length == 3)
            msg_args = `[Error]: ${msg.author.username}, you've entered an invalid # of arguments to !honor`
            msg_args += `\nTry typing "!honor HASH1 HASH2" `
            msg.reply(msg_args)
            return //Return out of !honor because things will error later if we have bad args
        }
        var name = msg.author.username
        var tx1hash = args[1]
        var tx2hash = args[2]
        // Get the transactions from ether.js then convert WEI --> ETH 
        tx_data1 = await provider.getTransaction(tx1hash)
        tx_data2 = await provider.getTransaction(tx2hash)
        // Make sure that the transactions came back properly from getTransaction
        // and if they did not, we need to break out of the script so the bot doesn't crash
        if(tx_data1 == null) {
            msg_tx_null = `[Error]: ${msg.author.username}, please check that you've entered an valid HASH: \n`
            msg_tx_null += tx1hash
            msg.reply(msg_tx_null)
            return //Return out of !honor because things will error later if we have no tx_data1
        } else if(tx_data2 == null) {
            msg_tx_null = `[Error]: ${msg.author.username}, please check that you've entered an invalid HASH: \n`
            msg_tx_null += tx2hash
            msg.reply(msg_tx_null)
            return //Return out of !honor because things will error later if we have no tx_data2
        }
        value1 = tx_data1["value"]/1000000000000000000        
        value2 = tx_data2["value"]/1000000000000000000

        // Determine if the 1st address is the ETH sender
        if(value1 > value2 && tx_data2["to"] == contactAddressVoxies) {
            // this means that the tx_data1 was the ETH payment transaction
            ETHvalue = value1
            ETHsender = tx_data1["from"] //full ETH addy
            ETHreceiver = tx_data1["to"] //full ETH addy
            VOXIESsender = tx_data2["from"] //full ETH addy
            VOXIESdata = tx_data2["data"]
            VOXIESvalue = 1;

        // Determine if the 2nd address is the ETH sender
    } else if(value2 > value1 && tx_data1["to"] == contactAddressVoxies) {
            // this means that the tx_data2 was the ETH payment transaction
            ETHvalue = value2
            ETHsender = tx_data2["from"] //full ETH addy
            ETHreceiver = tx_data2["to"] //full ETH addy
            VOXIESsender = tx_data1["from"] //full ETH addy
            VOXIESdata = tx_data1["data"]
            VOXIESvalue = 1;

        // Determine if the addresses either have no significant value or no Voxies transaction
        } else {
            flag += 1
            msg_value = "[Error]: Please make sure there is 1 transaction with a Voxies NFT sent and 1 Transaction with ETH sent"
            msg.reply(msg_value)
            return  //had to add this return because it's critical to populate the VOXIESdata and other stuff or the code crashes
                    // also it's faster to just stop here if it's gone wrong
        }
        // Find out who received the Voxies NFT
        VOXIESreceiver = "0x" + VOXIESdata.split("000000000000000000000000")[2]
        // Search the ETH addresses for a respective ENS name (for brevity)
        ETHsenderENS_pre = await provider.lookupAddress(ETHsender)
        ETHreceiverENS_pre = await provider.lookupAddress(ETHreceiver)
        VOXIESsenderENS_pre = await provider.lookupAddress(VOXIESsender)
        VOXIESreceiverENS_pre = await provider.lookupAddress(VOXIESreceiver)
        // also make sure that the ENS isn't just null..
        if(ETHsenderENS_pre === null) {
            ETHsenderENS=ETHsender
        } else {
            ETHsenderENS=ETHsenderENS_pre
        }
        if(ETHreceiverENS_pre === null) {
            ETHreceiverENS=ETHreceiver
        } else {
            ETHreceiverENS=ETHreceiverENS_pre
        }
        if(VOXIESsenderENS_pre === null) {
            VOXIESsenderENS=VOXIESsender
        } else {
            VOXIESsenderENS=VOXIESsenderENS_pre
        }
        if(VOXIESreceiverENS_pre === null) {
            VOXIESreceiverENS=VOXIESreceiver
        } else {
            VOXIESreceiverENS=VOXIESreceiverENS_pre
        }
        
        // Make sure people cannot send unrelated transactions
        if(ETHreceiver.toLowerCase() != VOXIESsender.toLowerCase() || ETHsender.toLowerCase() != VOXIESreceiver.toLowerCase()) {
            flag += 1
            msg_degens = "[Error]: These transactions are not between the same two individuals..." + "\n"
            msg_degens += ETHsenderENS + " sent " + ETHvalue + " ETH to " + ETHreceiverENS + "\n" + "but... \n"
            + VOXIESsenderENS +" sent " + VOXIESvalue +" Voxies NFT to " + VOXIESreceiverENS + "\n"
        }

        // Make sure the transactions happen within 10-minutes of each other
        var stat1 = await isTransactionMined(tx1hash)
        var stat2 = await isTransactionMined(tx2hash)
        if ((stat1.to = stat2.from) && stat2.logs.length) {
            const bn1 = await provider.getBlock(stat1.blockNumber)
            const bn2 = await provider.getBlock(stat2.blockNumber)
            const timepass = Math.abs(bn1.timestamp - bn2.timestamp)
            if (timepass <= 600) {
                //msg.author.send(`... ... ... PLING! Honor level increased.`)
            } else {
                flag += 1
                msg_time =`[Error]: Transactions occured outside of 10 minutes! \n`
            }
        }

        // Now read the Database and get some values!
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: msg.author.id}
            }
            // everything in the try in case things aren't grabbed from DynamoDb
            try {
                return docClient.get(params).promise(); //grabs the data from DynamoDB for the discordID = partition Key               
                }
            catch (err) {
                console.log(err)
            }} 
            
        var data = await getitem();   
        //Check if the user has yet to register
        if(data.Item === undefined || data.Item === null) {
            msg.reply(`${msg.author.username}, you have not registered yet. Please type "!reg" to register.`)
            return
        } 
        //Now it's time to parse through the data for this discordID
        Old_ETH = data["Item"]["ETHTotal"] 
        Total_ETH = Old_ETH + ETHvalue            //tally up the ETH
        Old_VOXIES = data["Item"]["VOXIESTotal"]
        Total_VOXIES = Old_VOXIES + VOXIESvalue   //tally up the Voxies

        //Search for Known Degens and add new ones if not known
        New_Degens = [ETHsenderENS, ETHreceiverENS, VOXIESsenderENS, VOXIESreceiverENS] //grab the transactions from earlier so they're iterable
        Old_Degens = data["Item"]["FellowDegens"]//["values"]
        // This for/if/if loop is to check the wallets involved in the transaction and see if they're already registered 
        // on the DynamoDB. Then if they're already found in the database entry for this Discord ID, then they aren't 
        // added to Total_Degens variable (outside of for loop). So the Total_Degens variable is the FULL history of ...
        // Degens that have interacted with this Discord ID and has been verified to not include any duplicates
        // FUTURE STUFF: Try to just see if any of the 4 New_Degens exist in the Old_Degens with a for-loop i=0 to 4
        var tmp_Degens = [];
        for (let i = 0; i < Old_Degens.length + New_Degens.length; i++) {
            if (i < Old_Degens.length) { 
                if (Old_Degens[i] == New_Degens[0] || Old_Degens[i] == New_Degens[1] || Old_Degens[i] == New_Degens[2] || Old_Degens[i] == New_Degens[3]) {
                    console.log("Dupe Degen found : ", Old_Degens[i]) 
                }
                tmp_Degens[i] = Old_Degens[i]
            } else {
                tmp_Degens[i] = New_Degens[i-Old_Degens.length]
            } 
        }
        let Total_Degens = [...new Set(tmp_Degens)]; //This returns ONLY unique values of tmp_Degens

        //Handle Transaction and search for dupe transactions
        tx = [tx1hash,tx2hash] //grab the transactions from earlier so they're iterable
        Old_tx = data["Item"]["EtherscanTransactions"]//["values"]
        var tmp_tx = [];
        msg_tx = ''
        // This for/if/if loop is to check the transactions iand see if they're already registered on the DynamoDB. 
        // Then if they're already found in the database entry for this Discord ID, a flag is tossed to invalidate 
        // this attempted HONOR.
        for (let i = 0; i < Old_tx.length + tx.length; i++) {
            if (i < Old_tx.length) {
                if (Old_tx[i] == tx[0] || Old_tx[i] == tx[1]) { //if string exists = BAD ACTOR
                    flag += 1 //if they tried to use an existing tx, deny their HONOR!
                    msg_tx += "[Error]: Dupe tx found : " + Old_tx[i] +'\n'
                }
                tmp_tx[i] = Old_tx[i]
            } else {
                tmp_tx[i] = tx[i-Old_tx.length]
            }
        }
        let Total_tx = [...new Set(tmp_tx)]; //This returns ONLY unique values of tmp_tx

        // This will be where we check the Total_tx and Total_savedAddresses against Global_tx 
        // and Global_savedAddresses
        const getitem_global = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { OreoEtherion: '000000000000000000'}
            }
            // everything in the try in case things aren't grabbed from DynamoDb
            try {
                return docClient.get(params).promise(); //grabs the data from DynamoDB for the discordID = partition Key               
                }
            catch (err) {
                console.log(err)
            }} 
        var data_global = await getitem_global();   
        //Check to make sure there has been anything stored in the Global user yet
        //I don't expect to ever see this msg_global populated as we will always have something in Global
        if(data_global.Item === undefined || data_global.Item === null) {
            msg_global = `[Warning]: There appears to be nothing stored in the Global User. \n` 
            msg_global += `Please alert Oreo or Etherion, as the AWS storage server is acting up.`
            msg.reply(msg_global)
        } 

        Global_tx = data_global.Item.EtherscanTransactions

        // If all has gone well and flag == 0, then proceed to honor them!
        if(flag == 0) {
            // if all is good, SEND THESE VALUES OUT BOIIIIIIIIII
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Item: {
                    OreoEtherion: msg.author.id,
                    EtherscanTransactions: Total_tx,
                    ETHTotal: Total_ETH,
                    VOXIESTotal: Total_VOXIES,
                    FellowDegens: Total_Degens
                }
            }
            docClient.put(params).promise()

            messageContent = name + ' has been honored for : ' + ETHvalue + ' ETH & ' + '1 VOXIES NFT'
            messageContent += "\n" + ' in a trade between: ' + ETHsenderENS + ' & ' + VOXIESsenderENS
            messageContent += "\n" + name + ' now has been honored for a total of: ' + Total_ETH + 'ETH!'
            msg.reply(messageContent)
        } else {
            messageContent = name + ", it appears you've logged the following errors: \n"
            messageContent += msg_time
            messageContent += msg_tx
            messageContent += msg_degens
            messageContent += msg_value
            msg.reply(messageContent)
        }
    }
})

client.login(TOKEN)
