import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery';
import {inject as service} from '@ember/service';

export default class PerformanceComponent extends Component {
    @service ('websockets') websockets;

    clientname = undefined;

    constructor() {
        super(...arguments);
        google.charts.load('current', {packages: ['corechart','table']});
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
            this.chartHandler(d);
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
            this.chartHandler(response);
        }).catch(function (error) {
            console.log(error);
        })
    }
    chartHandler(response) {
        this.clearChartDiv();
        let cpustats = this.toChartData(response);
        this.drawChart(cpustats);
    }
    clearChartDiv() {
        $('#cpustats_div').empty();
        $('#memory_div').empty();
    }
    toChartData(response) {
        let d = {
            loadavgpast1:response["loadavgpast1"],
            loadavgpast5:response["loadavgpast5"],
            loadavgpast15:response["loadavgpast15"],
            totalram:response["totalram"],
            freeram:response["freeram"],
            usedram:response["usedram"],
            totalswap:response["totalswap"],
            freeswap:response["freeswap"],
            usedswap:response["usedswap"]
        }
        return d;
    }
    drawChart(data) {
        var cpuval = this.cpu_div_arrayType(data);
        var memval = this.memory_div_arrayType(data);
        var chart1 = new google.visualization.LineChart(document.getElementById("cpustats_div"));
        var chart2 = new google.visualization.BarChart(document.getElementById("memory_div"));
        chart1.draw(cpuval[0],cpuval[1]);
        chart2.draw(memval[0],memval[1]);
    }
    cpu_div_arrayType(data) {
        var d = google.visualization.arrayToDataTable([
            ['Time for the past','Load Average'],
            ['1 minute',          data.loadavgpast1],
            ['5 minutes',          data.loadavgpast5],
            ['15 minutes',         data.loadavgpast15]
        ]);
        var options = {
            title: 'CPU Load Average for the past 1 minute, 5 minutes, 15 minutes',
            curveType: 'function',
            legend: { position: 'bottom' }
        };
        return [d,options];        
    }
    memory_div_arrayType(data) {
        var d = google.visualization.arrayToDataTable([
            ['Type',      'Total',{ role: 'annotation'}, 'Free',{ role: 'annotation'}, 'Used',{ role: 'annotation'}],
            ['RAM size',  data.totalram,"Total RAM",   data.freeram,"Free RAM",    data.usedram,"Used RAM"],
            ['Swap space',   data.totalswap,"Total space",   data.freeswap,"Free space",    data.usedswap,"Used space"]
        ]);
        var options = {title: 'RAM size (in Bytes)\nSwap space (in Bytes)'};
        return [d,options];        
    }
}