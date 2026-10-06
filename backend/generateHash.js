const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter your admin password: ", async (password) => {
    const hash = await bcrypt.hash(password, 12);

    console.log("\nYour password hash is:\n");
    console.log(hash);

    rl.close();
});