// abis/liquidity.ts
export const ERC20_ABI = [
  { type:'function', name:'decimals', stateMutability:'view', inputs:[], outputs:[{type:'uint8'}] },
  { type:'function', name:'symbol',   stateMutability:'view', inputs:[], outputs:[{type:'string'}] },
  { type:'function', name:'name',     stateMutability:'view', inputs:[], outputs:[{type:'string'}] },
  { type:'function', name:'balanceOf',stateMutability:'view', inputs:[{name:'a',type:'address'}], outputs:[{type:'uint256'}] },
  { type:'function', name:'allowance',stateMutability:'view', inputs:[{type:'address'},{type:'address'}], outputs:[{type:'uint256'}]},
  { type:'function', name:'approve',  stateMutability:'nonpayable', inputs:[{type:'address'},{type:'uint256'}], outputs:[{type:'bool'}] },
]

export const ROUTER_V2_ABI = [
  { type:'function', name:'factory', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'WETH', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'addLiquidity', stateMutability:'nonpayable', inputs:[
    {name:'tokenA',type:'address'},{name:'tokenB',type:'address'},
    {name:'amountADesired',type:'uint256'},{name:'amountBDesired',type:'uint256'},
    {name:'amountAMin',type:'uint256'},{name:'amountBMin',type:'uint256'},
    {name:'to',type:'address'},{name:'deadline',type:'uint256'}
  ], outputs:[
    {type:'uint256'},{type:'uint256'},{type:'uint256'}
  ]},
  { type:'function', name:'addLiquidityETH', stateMutability:'payable', inputs:[
    {name:'token',type:'address'},
    {name:'amountTokenDesired',type:'uint256'},
    {name:'amountTokenMin',type:'uint256'},
    {name:'amountETHMin',type:'uint256'},
    {name:'to',type:'address'},
    {name:'deadline',type:'uint256'}
  ], outputs:[
    {type:'uint256'},{type:'uint256'},{type:'uint256'}
  ]},
]

export const FACTORY_V2_ABI = [
  { type:'function', name:'getPair', stateMutability:'view', inputs:[{type:'address'},{type:'address'}], outputs:[{type:'address'}] },
]

export const PAIR_V2_ABI = [
  { type:'function', name:'getReserves', stateMutability:'view', inputs:[], outputs:[
    {name:'reserve0',type:'uint112'},
    {name:'reserve1',type:'uint112'},
    {name:'blockTimestampLast',type:'uint32'}
  ]},
  { type:'function', name:'token0', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'token1', stateMutability:'view', inputs:[], outputs:[{type:'address'}] },
  { type:'function', name:'balanceOf', stateMutability:'view', inputs:[{type:'address'}], outputs:[{type:'uint256'}] },
  { type:'function', name:'totalSupply', stateMutability:'view', inputs:[], outputs:[{type:'uint256'}] },
]
