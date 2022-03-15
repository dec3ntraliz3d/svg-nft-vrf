

// Example from stackOverflow on how to configre Key as string to avoid 
// Element implicitly has an 'any' type because expression of type 'string' can't be used to index type
// error

// https://stackoverflow.com/questions/57438198/typescript-element-implicitly-has-an-any-type-because-expression-of-type-st
// const color : { [key: string]: any } = {
//     red: null,
//     green: null,
//     blue: null
// };

interface IVRFNetworkParams {
    name?: string,
    fee?: string,
    keyHash?: string,
    linkToken?: string,
    vrfCoordinator?: string,
    //[key:string] : any
}


export const ChainlinkConfig: { [key: string]: IVRFNetworkParams } = {
    default: {
        name: 'hardhat',
        fee: '100000000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',

    },
    31337: {
        name: 'localhost',
        fee: '100000000000000000',
        keyHash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
    },
    4: {
        name: 'rinkeby',
        linkToken: '0x01BE23585060835E02B77ef475b0Cc51aA1e0709',
        keyHash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
        vrfCoordinator: '0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B',
        fee: '100000000000000000',

    }


}

