import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import jQuery from 'jquery';
import { tracked } from '@glimmer/tracking';

export default class SignupComponent extends Component {
    empId = "";
    empName = "";
    password = "";
    rePassword = "";
    designation = "";
    place = "";

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

    @action onSelectDesignation(designation) {
        this.designation = designation;
    }

    @action onSubmitRegister() {
        if(this.empId == "" || this.empName == "" || this.password == "" || this.rePassword == "" || this.designation == "" || this.place == "") {
            this.toast.error('',"Fill all the fields",this.toastOptions);
        } else if(this.password === this.rePassword){
            this.registerReq();
        } else {
            this.toast.error('',"Password Does not match",this.toastOptions);
        }
    }

    registerReq() {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/empSignUp",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "empid": this.empId,
                "password": this.password,
                "name": this.empName,
                "designation": this.designation,
                "place": this.place
            })
        }).then((response) => {
            if(response === "SUCCESS") {
                this.router.transitionTo('signin');
                this.toast.success("Try to Login","Sign Up Successful",this.toastOptions);
            } else {
                this.toast.error("Enter valid EmployeeID and Password","Login Failed",this.toastOptions);
            }
        }).catch(function (error) {
            console.log(error);
        });
    }

}