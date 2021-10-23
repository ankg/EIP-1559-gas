import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Line } from 'react-chartjs-2';
import "bootstrap/dist/css/bootstrap.min.css";
import "jquery/dist/jquery.min.js";
import "bootstrap/dist/js/bootstrap.min.js";

class Website extends React.Component {
	constructor(props){
		super(props);

		const data = {
		  labels: ['1'],
		  datasets: [
		    {
		      label: 'Gas price for last 20 blocks',
		      data: [1],
		      fill: false,
		      backgroundColor: '#ADD8E6',
		      borderColor: '#1E5162',
		    }
		  ]
		};

		const options = {
		  scales: {
		    y: {
		      beginAtZero: true
		    }
		  }
		};

		this.state = {
			chartData: data,
			options: options
		};
	}

	async calculateValues(web3, currGasPrice, feeHistory, currPriorityFee) {

		//if currGasPrice is not equal to baseFee
		const currBaseFee = currGasPrice - currPriorityFee;
		let gasFeeArr = [];
		let baseFeeArr = [];
		let priorityFeeArr = [];
		let avgFee = 0;
		for(let i=0;i<20;i++)
		{
			let blockBaseFee = parseInt(feeHistory["baseFeePerGas"][i], 16);
			let blockPriorityFee = parseInt(feeHistory["reward"][i][0], 16);

			let totalFee = blockBaseFee + blockPriorityFee; 
			totalFee = Number(web3.utils.fromWei(String(totalFee), "gwei"));

			gasFeeArr.push(totalFee);
			blockBaseFee = Number(web3.utils.fromWei(String(blockBaseFee), "gwei"));
			blockPriorityFee = Number(web3.utils.fromWei(String(blockPriorityFee), "gwei"));;

			baseFeeArr.push(blockBaseFee);
			priorityFeeArr.push(blockPriorityFee);

			avgFee += totalFee;
		};
		avgFee /= 20;

		return [currBaseFee, gasFeeArr, baseFeeArr, priorityFeeArr, avgFee];
	}

	async getCurrentParams(web3) {
		const currBlockNumber = await web3.eth.getBlockNumber();
		console.log("The latest block number is " + currBlockNumber);

		let currGasPrice = await web3.eth.getGasPrice();
		currGasPrice = Number(web3.utils.fromWei(String(currGasPrice), "gwei"));
		const feeHistory = await web3.eth.getFeeHistory(20,"latest",[50,50]);

		let currPriorityFee = await web3.eth.getMaxPriorityFeePerGas();
		currPriorityFee = parseInt(currPriorityFee, 16);
		currPriorityFee = Number( web3.utils.fromWei(String(currPriorityFee), "gwei") );

		const calculated = await this.calculateValues(web3, currGasPrice, feeHistory, currPriorityFee);

		const labels = Array.from({length: 20}, (_, i) => String(i + 1))
		const data = {
		  labels: labels,
		  datasets: [
		    {
		      label: 'Avg Priority Fee per gas for block ID',
		      data: calculated[3],
		      fill: true,
		      backgroundColor: '#ADD8E6',
		      borderColor: '#003C54',
		    },
		    {
		      label: 'Base Fee per gas for block ID',
		      data: calculated[2],
		      fill: false,
		      backgroundColor: '#ff9889',
		      borderColor: 'red',
		    },
		    {
		      label: 'Total Gas price per gas for block ID',
		      data: calculated[1],
		      fill: false,
		      backgroundColor: '#ffc837',//'#ccf6ef',
		      borderColor: '#ffc837',//'#338f85',
		    }		    		    
		  ]
		};

		const options = {
		  scales: {
		    y: {
		      beginAtZero: true,
		      title:{
		      	text: "Gas Price (in Gwei)",
		      	display: true, 
		      }
		    },
		    x: {
		    	title: {
		    		text: "Block ID (old to new)",
		    		display: true
		    	}
		    }
		  },
		  plugins: {
		  	title: {
		  		display: true,
		  		text: 'Real-time gas prices for last 20 blocks mined',
		  		padding: {
		  			bottom: 15
		  		},
		  		font: {
		  			size: 20
		  		}
		  	}
		  }
		};

		this.setState({
			currBlockNumber: currBlockNumber,
			currGasPrice: currGasPrice,
			feeHistory: feeHistory,
			currPriorityFee: Number(currPriorityFee.toFixed(2)),
			currBaseFee: Number(calculated[0].toFixed(2)),
			gasFeeArr: calculated[1],
			avgFee: Number(calculated[4].toFixed(2)),
			chartData: data,
			options: options
		})
	}

	async componentDidMount() {
		//Initialize alchemy api
		const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
		//const web3 = createAlchemyWeb3("https://eth-mainnet.alchemyapi.io/v2/G2vhog_V17pUJjNHRFyiCtdPlQt3ChvK");
		const web3 = createAlchemyWeb3("wss://eth-mainnet.alchemyapi.io/v2/G2vhog_V17pUJjNHRFyiCtdPlQt3ChvK");
		var obj = this;
		web3.eth.subscribe("newHeads", function(val){
			console.log("new block emitted");
			obj.getCurrentParams(web3);
		});

		this.getCurrentParams(web3);	
	}

	render()
	{
		let currTotalFee = this.state.currPriorityFee+this.state.currBaseFee;
		currTotalFee = Number(currTotalFee.toFixed(2));

		return(
			<div className="container body-all">
				<div className="row">
					<div className="col-8">
					<Line data={this.state.chartData} options={this.state.options} />
					</div>
					<div className="col-4">
						<div className="col card ml-2 mt-5 text-success border-success bg-transparent">
						  <div className="card-header bg-transparent"><b>Network</b></div>
						  <div className="card-body text-success">
						    <p className="card-text display-6">Ethereum Mainnet</p>
						  </div>
						</div>
						<div className="col card ml-2 mt-4 text-secondary border-secondary bg-transparent">
						  <div className="card-header bg-transparent"><b>Avg Gas fee for last 20 blocks</b></div>
						  <div className="card-body text-secondary">
						    <p className="card-text display-5">{this.state.avgFee} Gwei</p>
						  </div>
						</div>
					</div>
				</div>
				<hr />
				<div className="text-center">
					<h5>Real-time gas fee details <small><i>(updates automatically)</i></small></h5>
					<br />
					<div className="row d-flex">
						<div className="col card text-secondary border-secondary bg-transparent">
						  <div className="card-header bg-transparent"><b>Current Block Number</b></div>
						  <div className="card-body text-secondary">
						    <p className="card-text display-5">{this.state.currBlockNumber}</p>
						  </div>
						</div>
						<div className="col card text-success border-success bg-transparent">
						  <div className="card-header bg-transparent"><b>Current Base Fee</b></div>
						  <div className="card-body text-success">
						    <p className="card-text display-5">{this.state.currBaseFee} Gwei</p>
						  </div>
						</div>
						<div className="col card text-dark border-dark bg-transparent">
						  <div className="card-header bg-transparent"><b>Current Priority Fee</b></div>
						  <div className="card-body text-dark">
						    <p className="card-text display-5">{this.state.currPriorityFee} Gwei</p>
						  </div>
						</div>
						<div className="col card text-success border-success bg-transparent">
						  <div className="card-header bg-transparent"><b>Total Current Fee</b></div>
						  <div className="card-body text-success">
						    <p className="card-text display-5">{currTotalFee} Gwei</p>
						  </div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

ReactDOM.render(
  <React.StrictMode>
    <Website />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
