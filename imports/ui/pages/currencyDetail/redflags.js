import { Template } from 'meteor/templating'
import { Redflags, Currencies } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie';

import './redflags.html'
import './redflag.js'
import './redflagComment.js'

Template.redflags.onCreated(function(){
  this.showredflagged = new ReactiveVar(false)
  this.addingnewredflag = new ReactiveVar(false)
  this.lastId = new ReactiveVar('')

  this.autorun(() => {
    this.currencyId = (Currencies.findOne({ slug: FlowRouter.getParam("slug") }) || {})._id

    if (this.currencyId) {
      SubsCache.subscribe('redflags', this.currencyId)
    }
  })
});


Template.redflags.helpers({
    alreadyVoted: function(id){
    if(_.include(Redflags.findOne(id).appealVoted, Meteor.userId())){
      return true;
    }
  },
  redflagDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  redflags: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1,createdAt:-1}}).fetch();
  },
  redflagsFlagged: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$gt: 0.6}});
  }
});

Template.redflags.events({
  'click .flag-help-button .help': function() {
    $('#addRedFlagModal').modal('show');
  },
  'mouseover .help': function() {
    $('.help').css('cursor', 'pointer');
  },
  'focus #redflagContent': function() {
    if(Cookies.get('addRedFlagModal') != "true") {
      $('#addRedFlagModal').modal('show');
      Cookies.set('addRedFlagModal', true);
    }
  },
  'mouseover .currency-redflags .currencyDetailBox': function() {
    if(_.size(Redflags.find({}).fetch()) == 0 && !Cookies.get('addRedFlagModal')) {
      $('#addRedFlagModal').modal('show');
      Cookies.set('addRedFlagModal', true);
    }
  },
  'keyup #redflagContent': function() {
    $('#redflagContent').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#charNumFlag').text(' you have reached the limit');
  } else {
    var char = max - len;
    $('#charNumFlag').text(char + ' characters left');
  }
});
  },
  'click .submitRedFlag': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to red flag a currency");
    }
    var data = $('#redflagContent').val();
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      let res 
      try {
        res = grecaptcha && grecaptcha.getResponse()
      } catch(e) {
        res = 'pass'
      }
      const templ = Template.instance()
      Meteor.call('newRedFlagMethod', this._id, data, res, (err, data) => {
        if (!err) {
          $('#redflagContent').val(" ");
          $(".showAddNewRedflag").show();
          $(".addNewRedflagContainer").hide();
          templ.addingnewredflag.set(false);
          sAlert.success("Thanks! Red flag added")
        } else {
          sAlert.error(err.reason)
        }
      })
    }
  },
  'click .showAddNewRedflag': function() {
    $(".showAddNewRedflag").hide();
    $(".addNewRedflagContainer").show();
    $("#redflagContent").focus();
  },
  'click .cancelNewRedFlag': function() {
    $(".showAddNewRedflag").show();
    $(".addNewRedflagContainer").hide();
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);


  }
});

