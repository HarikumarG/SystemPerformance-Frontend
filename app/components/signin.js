import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import jQuery from 'jquery';
import { tracked } from '@glimmer/tracking';

export default class SigninComponent extends Component {
    
    empId = "";
    password = "";

    @service ('employee-details') details;

    @service router;
    @service ('toast') toast;
    toastOptions = {
        closeButton: false,
        debug: false,
        newestOnTop: true,
        progressBar: false,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        onclick: null,
        showDuration: '300',
        hideDuration: '1000',
        timeOut: '3000',
        extendedTimeOut: '1000',
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'show',
        hideMethod: 'hide'
    }

    @action onSubmitLogin() {
        if(this.empId == "" || this.password == "") {
            this.toast.error('',"Fill both the fields",this.toastOptions);
        } else {
            this.loginReq(this.empId,this.password);
        }
    }

    loginReq(id,password) {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/empSignIn",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "empid": id,
                "password": password
            })
        }).then((response) => {
            if(response["Status"] === "SUCCESS") {
                this.details.setEmpName(response["EmpName"]);
                this.details.setEmpId(id);
                this.details.setPassword(password);
                this.router.transitionTo('performance');
            } else {
                this.toast.error("Enter valid UserID and Password","Login Failed",this.toastOptions);
            }
        }).catch(function (error) {
            console.log(error);
        });
    } 

}