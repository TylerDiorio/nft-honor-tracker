// @authors: Oreo | Etherion
// @updated last: 07/11/2022
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
// Contact Address for Voxie Tactics Items
var contactAddressVoxiesItem = 0x8F8E18DbEbb8CA4fc2Bc7e3425FcdFd5264E33E8;
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
    if(msg.content.startsWith("!reg")) {
        // Searches AWS database to check if the user is already registered
        const getitem = async() => {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                Key: { id420lite: msg.author.id}
            }
            return docClient.get(params).promise()
        }
        var regc = await getitem();
        if(regc.Item === undefined) {
            const params = {
                TableName: process.env.AWS_TABLE_NAME,
                    Item: {
                        id420lite: msg.author.id,
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
        var name = msg.author.username
        var tx1hash = args[1]
        var tx2hash = args[2]

        // Get the transactions from ether.js then convert WEI --> ETH 
        tx_data1 = await provider.getTransaction(tx1hash)
        value1 = tx_data1["value"]/1000000000000000000
        tx_data2 = await provider.getTransaction(tx2hash)
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
                msg_time =`[Error]: Transactions occured outside of 10 minutes!`
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
                const data = await docClient.get(params).promise(); //grabs the data from DynamoDB for the discordID = partition Key
                
                //Check if the user has yet to register
                if(data.Item === undefined) {
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
                        console.log(Old_tx[i]) 
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
            catch (err) {
                console.log(err)
            }
        }
        getitem()
    }
})

client.login(TOKEN)
