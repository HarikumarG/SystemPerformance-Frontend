import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery';
import {inject as service} from '@ember/service';

export default class PerformanceComponent extends Component {
    @service ('websockets') websockets;

    clientname = undefined;
    dps1 = [];
    dps5 = [];
    dps15 = [];
    dpsUsedRAM = [];
    dpsUsedSwap = [];
    chartCpu = undefined;
    chartRAM = undefined;
    chartSwap = undefined;
    constructor() {
        super(...arguments);
        this.getName();
    }
    getName() {
        var name = prompt("Enter your name");
        if(name == null || name == "")
            this.getName();
        else {
            this.clientname = name;
            this.initializeWebsocket();
        }
    }
    initializeWebsocket() {
        const socket = this.websockets.socketFor('ws://localhost:8080/SystemPerformance-Backend/getStatsWebsocket');
        socket.on('open',() => {
            console.log("Connected to the server");
            this.initializeGraph();
            let packet = {
                type:"login",
                name:this.clientname
            }
            this.sendData(socket,packet);
        });
        socket.on('close',() => {
            console.log("Connection is closed");
            socket.close();
        });
        socket.on('message',(data) => {
            let d = JSON.parse(data.data);
            console.log('From Websocket ',d);
            this.chartRender(d);
        });
    }
    sendData(conn,packet) {
        conn.send(JSON.stringify(packet));
    }
    @action onGetstats() {
        this.getStatsReq();
    }
    getStatsReq() {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getStatsHttp",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "name":this.clientname
            })
        }).then((response) => {
            console.log('From Http ',response);
        }).catch(function (error) {
            console.log(error);
        })
    }
    initializeGraph() {
        this.chartCpu = new CanvasJS.Chart("cpustats_div", {
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: "CPU Usage"
            },
            axisY: {
		        title: "Load average value"
	        },
            axisX: {
                title: "System Uptime (in seconds)"
            },
            toolTip: {
                shared: "true"
            },
            data: [
            {
                type: "spline",
                showInLegend: true,
                markerSize: 0,
                name: "Past 1 min",
                dataPoints: this.dps1
            },
            {
                type: "spline",
                showInLegend: true,
                markerSize: 0,
                name: "Past 5 mins",
                dataPoints: this.dps5
            },
            {
                type: "spline",
                showInLegend: true,
                markerSize: 0,
                name: "Past 15 mins",
                dataPoints: this.dps15
            }]
        });
        this.chartRAM = new CanvasJS.Chart("RAM_memory_div", {
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: "RAM Usage (Total RAM = 6126325760 bytes)"
            },
            axisY: {
                title: "RAM Usage (in Bytes)"
            },
            axisX: {
                title: "System Uptime (in seconds)"
            },
            data:[
            {
                type: "spline",
                showInLegend: true,
                markerSize: 0,
                name: "Used RAM",
                dataPoints: this.dpsUsedRAM
            }]
        });
        this.chartSwap = new CanvasJS.Chart("Swap_memory_div", {
            animationEnabled: true,
            exportEnabled: true,
            title: {
                text: "Swap Usage (Total Swap space = 2147479552 bytes)"
            },
            axisY: {
                title: "Swap Usage (in Bytes)"
            },
            axisX: {
                title: "System Uptime (in seconds)"
            },
            data:[
            {
                type: "spline",
                showInLegend: true,
                markerSize: 0,
                name: "Used Swap space",
                dataPoints: this.dpsUsedSwap
            }]
        });
    }
    chartRender(data) {
        this.dps1.push({
            x: data["uptime"],
            y: data["loadavgpast1"]
        });
        this.dps5.push({
            x: data["uptime"],
            y: data["loadavgpast5"]
        });
        this.dps15.push({
            x: data["uptime"],
            y: data["loadavgpast15"]
        })

        this.dpsUsedRAM.push({
            x: data["uptime"],
            y: data["usedram"]
        })

        this.dpsUsedSwap.push({
            x: data["uptime"],
            y: data["usedswap"]
        })
        this.chartCpu.render();
        this.chartRAM.render();
        this.chartSwap.render();
    }

}