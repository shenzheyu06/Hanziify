import { Converter } from "opencc-js/t2cn";

// Base64 keeps Unicode intact across Windows PowerShell's native-command pipe.
const title = Buffer.from(process.argv[2], "base64").toString("utf8");
const convert = Converter({ from: "t", to: "cn" });
process.stdout.write(Buffer.from(convert(title), "utf8").toString("base64"));
