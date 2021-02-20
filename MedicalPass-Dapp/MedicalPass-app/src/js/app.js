App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    verified: false,
    url: 'http://127.0.0.1:7545',
    // network_id: 5777,
    chairPerson: null,
    currentAccount: null,
    clinic_data: {},
    init: function () {
        console.log("Checkpoint 0");
        return App.initWeb3();
      },
    
    initWeb3: function () {
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
          App.web3Provider = web3.currentProvider;
        } else {
          // If no injected web3 instance is detected, fallback to the TestRPC
          App.web3Provider = new Web3.providers.HttpProvider(App.url);
        }
        web3 = new Web3(App.web3Provider);
        ethereum.enable();
        App.populateAddress();
        return App.initContract();
      },
    initContract: function () {
        
        $.getJSON('MedicalPass.json', function (data) {
          var account = web3.eth.accounts[0];
          var accountInterval = setInterval(function() {
            if (web3.eth.accounts[0] !== account) {
              account = web3.eth.accounts[0];
              window.location.replace('index.html')
            }
          }, 100);
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var voteArtifact = data;
          App.contracts.vote = TruffleContract(voteArtifact);
          App.contracts.mycontract = data;
          // Set the provider for our contract
          App.contracts.vote.setProvider(App.web3Provider);
          App.currentAccount = web3.eth.coinbase;
          $('#input_Address').val(App.currentAccount);
          $('#inputAddress').val(App.currentAccount);
          return App.populateBoard();
        });
      },
    
    bindEvents: function () {
      //general functions
        $(document).on('click', '#singup', App.handleSignup);
        $(document).on('change','#role', App.chooseForm);
        $(document).on('click', '#register',App.handleRegister);
        $(document).on('click','#signin',App.handleSignin);
        $(document).on('click','#return_signin',App.returnToSignin);

      // doctor functions
        $(document).on('click','#record_Visit',App.handleRecordvisit);
        $(document).on('click','#view_patient_detail',App.handleViewPatientInfo);
        $(document).on('click','#view_recent_record',App.handleViewMostRecord);
        $(document).on('click','#revisit',App.handleUpdateVisit);
        $(document).on('click','#send_report',App.handleSendApptReport);
        $(document).on('click','#send_lab_request',App.handleSendLabRequest);
        $(document).on('click','#accept_lab_result',App.handleAcceptLabResult);
        $(document).on('click','#check_lab_status',App.handleCheckLabStatus);

      //patient functions
        $(document).on('click','#patient_update',App.handleUpdateRecord);
        $(document).on('click','#patient_send',App.handleSendMedicalRecord);
        $(document).on('click',"#Patient_view_recent_record",App.handlePatient_View_recent_record)
        //$(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });

      //lan functions
        $(document).on('click',"#lab_view_request",App.handlelab_view_request);
        $(document).on('click','#lab_AcceptLabRequest',App.handleAcceptLabRequest);
        $(document).on('click','#lab_decline',App.handleDeclineLabRequest);
        $(document).on('click','#labview_info',App.handleLabViewPatientInfo);
        $(document).on('click','#lab_send_result',App.handlelab_send_result);
      },
    populateAddress: function () {
        new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
          jQuery.each(accounts, function (i) {
            if (web3.eth.coinbase != accounts[i]) {
              var optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
              jQuery('#inputAddress').append(optionElement);
            }
          });
        });
      },
    populateBoard: function(){
      $.get('/ClincRecord',function(data,status){
        if(status == "success"){
          if($('#board').length){
            clinic_data = data;
            console.log(data);
            for(d in data){
              let detail = data[d];
              console.log(detail);
              $("#board tbody").append('<tr><th scope="row">'+ detail.Doc +'</th><td>'+detail.Status+'</td></tr>');
            }
          } 
        }
      })
      return App.bindEvents()
    },
    returnToSignin: function(event){
      $('#register_form').fadeOut();
      $('#signin_form').show("slow","swing");
    },
    handleSignup: function(event){
       $('#signin_form').fadeOut();
       $('#register_form').show("slow","swing");
    },
    chooseForm: function(event){
      if(this.value == 1){
        $('#patient_insurance').show("slow","swing");
        $('#patient_DOB').show("slow","swing");
      }else{
        $('#patient_insurance').hide();
        $('#patient_DOB').hide();
      }
    },
    updateDoctorStats: function(add,stat){
      $.post("/UpdateClincRecord",{
        Address:add,
        Status:stat
      })
    },

    handlelab_send_result:function (event) {
      var des = document.getElementById('lab_destination_add').value;
      var patient = document.getElementById("lab_patient_add").value;
      var info = document.getElementById("lab_note").value;

      App.contracts.vote.deployed().then(function(instance){
        return instance.SendLabResult(des,patient,info);
        
      }).then(function (result){
        App.showNotification("Labwork Ended");
      })
    },
    handleLabViewPatientInfo:function (event) {
      var pw = prompt("Please enter Password");
      var lab_patient_add = document.getElementById("lab_patient_add").value;
      App.contracts.vote.deployed().then(function(instance){
        return instance.ViewPatientInfo(lab_patient_add,pw);
        
      }).then(function (result){
        //document.getElementById("doctor_notes").value = func_return[0];
        var information = "Name: " + result[0] + "\n" + "Insurance: "+ result[1] + "\n" + "DOB: "+ new Date(result[2]['c'][0]).toDateString() + "\n";
        document.getElementById("lab_note").value = information;
        console.log(result);
      })
    },
    handlelab_view_request:function (event) {
      var pw = prompt("Please enter Password");
      App.contracts.vote.deployed().then(function (instance){
        return instance.ViewLabRequestDetail(pw);
      }).then(function (result){
        var output = "Subject: " + result[0] + "\n" + "Detail: " +result[1] + "\n" + "From: "+ result[2];
        document.getElementById("lab_note").value = output;
        console.log(result);
      })
    },
    handleDeclineLabRequest: function (event) {
      App.contracts.vote.deployed().then(function (instance){
        return instance.DeclineLabRequest();
      })
    },

    handleAcceptLabRequest:function (event) {
      var pw = parseInt(prompt("Password"));
      var cid = parseInt(prompt("Case id"));
      App.contracts.vote.deployed().then(function (instance){
        return instance.AcceptLabRequest(pw,cid);
      }).then(function (result){
        App.showNotification("Lab work started !");
      })
    },

    handlePatient_View_recent_record: function (event) {
      var add = document.getElementById("input_Address").value;
      var pw = prompt("Please enter Password");
      App.contracts.vote.deployed().then(function (instance){
        return instance.ViewMostRecentPatientRecord(add,pw);
      }).then(function (result){
        var res = "Record type: "+ result[0]['c'][0].toString()+ "\n" + "Record code: " + (result[1]) +"\n"+ "Detail: "+ result[2];
        document.getElementById("notes").value = res;
        console.log(result);
      })
    },
    handleSendMedicalRecord: function (event){
      var pw = prompt("Enter Password");
      var des = document.getElementById("Patient_Destination_Address").value;
      App.contracts.vote.deployed().then(function (instance) {
        return instance.SendMedicalRecord(des,pw);
      }).then(function (result) {
        App.showNotification("Sent !");
        
      })
    },

    handleUpdateRecord: function (event) {
      var pw = prompt("Enter Password");
      App.contracts.vote.deployed().then(function (instance) {
        return instance.UpdateRecord(pw);
      }).then(function (result) {
        console.log(result);
      })
    },
    handleUpdateVisit:function(event){
      var t = document.getElementById("RequireVisit").value;
      var add = document.getElementById("doctor_form_patient_address").value;
      App.contracts.vote.deployed().then(function (instance){
        if(t==1){
          return instance.RequestVisit(add);
        }
      }).then(function (result){
        App.showNotification("Notification Sent");
      })
    },
    handleAcceptLabResult:function(event){
      var pw = prompt("Please enter Password");
      var re_id=prompt("Result id");
      App.contracts.vote.deployed().then(function (instance) {
        return instance.AcceptLabResult(pw,re_id);
      })
    },
    handleCheckLabStatus: function (event) {
      var pw = prompt("Please enter Password");
      App.contracts.vote.deployed().then(function (instance) {
        return instance.CheckLabStatus(pw);
      }).then(function (result) {
        var information = "Patient: "+ result[2] + "\n" + "Lab: "+ result[1] + "\n" + "Detail: " + result[0] + "\n";
        document.getElementById("doctor_notes").value = information;
        console.log(result);
      })
    },
    handleSendApptReport: function(event){
        var rec_type = parseInt(prompt("Record type"));
        var rec_code = parseInt(prompt("Record code"));
        var add = document.getElementById("doctor_form_patient_address").value;
        var information = document.getElementById("doctor_notes").value;

        App.contracts.vote.deployed().then(function (instance){
          return instance.SendAppointmentDetail(add,information,rec_type,rec_code)
        }).then(function (result){
          if(result.receipt.status == 1){
            App.updateDoctorStats(App.currentAccount,"Free");
          }
          console.log(result);
          document.getElementById("doctor_notes").value = result;
        })
    },
    handleSendLabRequest:function(event){
      var lab_add = document.getElementById("doctor_form_lab_add").value;
      var pat_add = document.getElementById("doctor_form_patient_address").value;
      var information = document.getElementById("doctor_notes").value;
      var pw = prompt("Please enter Password");

      App.contracts.vote.deployed().then(function (instance){
        return instance.RequestLabWork(lab_add,pat_add,information,pw);
      }).then(function (result){
        console.log(result);
      })
      
    },
    
    handleViewPatientInfo:function(event){
      var pw = prompt("Please enter Password");
      var add = document.getElementById("doctor_form_patient_address").value;
      App.contracts.vote.deployed().then(function(instance){
        return instance.ViewPatientInfo(add,pw);
        
      }).then(function (result){
        //document.getElementById("doctor_notes").value = func_return[0];
        var information = "Name: " + result[0] + "\n" + "Insurance: "+ result[1] + "\n" + "DOB: "+ new Date(result[2]['c'][0]).toDateString() + "\n";
        document.getElementById("doctor_notes").value = information;
        console.log(result);
      })
    },
    
    handleRegister: function(event){
      var name =document.getElementById("name").value;
      var patient_insurance = document.getElementById("patient_insurance").value;
      var password = document.getElementById("password").value;
      var patient_DOB = new Date(document.getElementById("patient_DOB").value).getTime();
      var role = document.getElementById("role").value;

      if(role != 1){
        patient_insurance = -1;
        patient_DOB = -1; 
      }
      if(role == 2){
        App.updateDoctorStats(App.currentAccount,"Free");
      }
      App.contracts.vote.deployed().then(function (instance){
        return instance.Register(role,name,patient_insurance,patient_DOB,password);
      }).then(function (result){
        if(parseInt(result.receipt.status) == 1){
          App.showNotification("Registration Successful !");
        }
        console.log(result);
      }) 
    },
    handleRecordvisit:function(event){
      var add = document.getElementById("doctor_form_patient_address").value;
      App.contracts.vote.deployed().then(function (instance){
        
        return instance.RecordVisit(add,20);
      }).then(function(result){
        if(result.receipt.status == 1){
          App.updateDoctorStats(App.currentAccount,"Busy");
        }
        App.showNotification("Visit Started!")
        console.log(result);
      })

    },
    handleViewMostRecord:function(event){
      var add = document.getElementById("doctor_form_patient_address").value;
      var pw = prompt("Please enter Password");
      App.contracts.vote.deployed().then(function (instance){
        return instance.ViewMostRecentPatientRecord(add,pw);
      }).then(function (result){
        var res = "Record type: "+ result[0]['c'][0].toString()+ "\n" + "Record code: " + (result[1]) +"\n"+ "Detail: "+ result[2];
        document.getElementById("doctor_notes").value = res;
        console.log(result);
      })
    },

    handleSignin: function(event){

      var password = document.getElementById("inputPassword").value;
      

      App.contracts.vote.deployed().then(function (instance) {
        return instance.VerifyIdentity(password);
      }).then(function (result) {
        if (result){
          App.contracts.vote.deployed().then(function (instance){
            console.log(instance.VerifyIdentity(password));
              return instance.role(App.currentAccount);
          }).then(function (result){
    
            if (result['c'][0] == 1){
              window.location.replace('patient.html');
              
            }
            if (result['c'][0] == 2){
              window.location.replace('doc.html');
            }
            if (result['c'][0] == 3){
              window.location.replace('recep.html');
            }
            if (result['c'][0] == 4){
              window.location.replace('lab.html');
            }
          })
        }
      })
      

      
      
    },
    showNotification: function (text, type) {
      toastr.info(text, "", {
        iconClass: "toast-info notification" + String(type),
      });
    }, 
};

$(function () {
    $(window).load(function () {
      App.init();
      $('#register_form').hide();
      //Notification UI config
      toastr.options = {
        "showDuration": "1000",
        "positionClass": "toast-top-left",
        "preventDuplicates": true,
        "closeButton": true
      };
    });
});
  