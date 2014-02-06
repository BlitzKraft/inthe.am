var controller = Ember.Controller.extend({
  needs: ['tasks'],
  user: null,
  urls: {
    ca_certificate: '/api/v1/user/ca-certificate/',
    my_certificate: '/api/v1/user/my-certificate/',
    my_key: '/api/v1/user/my-key/',
    taskrc_extras: '/api/v1/user/taskrc/',
    taskd_settings: '/api/v1/user/configure-taskd/',
    taskd_reset: '/api/v1/user/reset-taskd-configuration/',
    status_feed: '/status/',
    sms_url: null,
  },
  init: function(){
    this.set(
      'user',
      JSON.parse(
        $.ajax(
          {
            url: '/api/v1/user/status/',
            async: false,
            dataType: 'json'
          }
        ).responseText
      )
    );
    this.set('urls.sms_url', this.get('user').sms_url);

    var statusUpdater = new EventSource(this.get('urls.status_feed'));
    var self = this;
    for (var key in this.get('statusActions')) {
      statusUpdater.addEventListener(
          key, 
          function(evt) {
            console.log("EXECUTED");
            debugger;
            self.get('statusActions.' + key)(self, evt);
          }
      );
    }

    $.ajaxSetup({
      headers: {
        'X-CSRFToken': this.getCookie('csrftoken')
      }
    });
  },
  statusActions: {
    'task_changed': function(self, evt) {
      debugger;
      console.log(evt);
    },
    'status': function(self, evt) {
      //console.log(evt);
    },
    'head_changed': function(self, evt) {
      //console.log(evt)
    }
  },
  getCookie: function(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  },
  updateStyles: function(){
    if(this.currentPath.substring(0, 5) == "tasks") {
      $("body").css('overflow', 'hidden');
    } else {
      $("body").css('overflow', 'scroll');
    }
  }.observes('currentPath'),
  actions: {
    'refresh': function(){
      this.get('controllers.tasks').refresh();
    }
  }
});

module.exports = controller;
