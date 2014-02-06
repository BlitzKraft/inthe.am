(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var App = Ember.Application.create({
});

App.ApplicationAdapter = DS.DjangoTastypieAdapter.extend({
  namespace: 'api/v1',
});
App.ApplicationSerializer = DS.DjangoTastypieSerializer.extend();

module.exports = App;

Ember.View.reopen({
  didInsertElement: function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, this.didRenderElement);
  },
  initializeFoundation: function(){
    Ember.run.debounce(
      this,
      function(){
        Ember.$(document).foundation();
      },
      250
    );
  },
  didRenderElement: function() {
    this.initializeFoundation();
  }
});

},{}],2:[function(require,module,exports){
var controller = Ember.Controller.extend({
  needs: ['application']
});

module.exports = controller;

},{}],3:[function(require,module,exports){
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
    //var statusUpdater = new EventSource(this.get('urls.status_feed'));
    //statusUpdater.addEventListener("status", function(e){
    //  console.log(e.data);
    //});
    $.ajaxSetup({
      headers: {
        'X-CSRFToken': this.getCookie('csrftoken')
      }
    });
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

},{}],4:[function(require,module,exports){
var controller = Ember.ArrayController.extend({
  sortProperties: ['-modified'],
  sortAscending: false,

  actions: {
    view_task: function(task){
      this.transitionToRoute('completedTask', task);
    }
  },
});

module.exports = controller;

},{}],5:[function(require,module,exports){
var controller = Ember.ObjectController.extend();

module.exports = controller;

},{}],6:[function(require,module,exports){
var controller = Ember.Controller.extend({
  needs: ['application'],

  submit_taskd: function(data) {
    if (
      data.certificate === false || data.key === false || data.ca === false
    ) {
      self.error_message("An error was encountered while uploading your files");
      return;
    } else if (
      !data.certificate || !data.key || !data.ca
    ) {
      return;
    }
    var url = this.get('controllers.application').urls.taskd_settings;
    var csrftoken = this.get('controllers.application').getCookie(
      'csrftoken'
    );
    var self = this;

    $.ajax({
      url: url,
      type: 'POST',
      headers: {
        'X-CSRFToken': csrftoken
      },
      data: data,
      success: function(){
        self.success_message("Taskd settings saved.");
      },
      error: function(xhr){
        var response = JSON.parse(xhr.responseText);
        for (var property in response) {
          self.error_message(
            "Error encountered: " + property + ": " + response[property]
          );
        }
      }
    });
  },
  error_message: function(message) {
    $("#settings_alerts").append(
      $("<div>", {'data-alert': '', 'class': 'alert-box error radius'}).append(
        message,
        $("<a>", {'href': '#', 'class': 'close'}).html("&times;")
      )
    );
    $(document).foundation();
  },
  success_message: function(message) {
    $("#settings_alerts").append(
      $("<div>", {'data-alert': '', 'class': 'alert-box success radius'}).append(
        message,
        $("<a>", {'href': '#', 'class': 'close'}).html("&times;")
      )
    );
    $(document).foundation();
  },
  actions: {
    save_taskrc: function() {
      var csrftoken = this.get('controllers.application').getCookie(
        'csrftoken'
      );
      var url = this.get('controllers.application').urls.taskrc_extras;
      var value = $('textarea[name=custom_taskrc]').val();
      var self = this;

      $.ajax({
        url: url,
        type: 'PUT',
        headers: {
          'X-CSRFToken': csrftoken
        },
        dataType: 'text',
        data: value,
        success: function() {
          self.success_message("Taskrc settings saved");
        },
        error: function() {
          self.error_message("An error was encountered while saving your taskrc settings.");
        }
      });
    },
    reset_taskd: function() {
      var csrftoken = this.get('controllers.application').getCookie(
        'csrftoken'
      );
      var url = this.get('controllers.application').urls.taskd_reset;
      var self = this;
      $.ajax({
        url: url,
        type: 'POST',
        headers: {
          'X-CSRFToken': csrftoken
        },
        data: {},
        success: function(){
          self.success_message("Taskd settings reset to default.");
        },
        error: function(xhr){
          self.error_message(
            "Error encountered while resetting taskd settings to defaults."
          );
        }
      });
    },
    save_taskd: function() {
      var data = {
        'server': document.getElementById('id_server').value,
        'credentials': document.getElementById('id_credentials').value,
      };
      var self = this;

      // Load Cert
      var cert_reader = new FileReader();
      cert_reader.onload = function(evt){
        data.certificate = evt.target.result;
        self.submit_taskd(data);
      };
      cert_reader.onerror = function(evt) {
        data.certificate = false;
        self.submit_taskd(data);
      };
      cert_reader.onabort = function(evt) {
        data.certificate = false;
        self.submit_taskd(data);
      };
      var cert_file = document.getElementById('id_certificate').files[0];
      if (cert_file === undefined) {
        self.error_message("Please select a certificate");
      }
      cert_reader.readAsBinaryString(cert_file);

      // Load Key
      var key_reader = new FileReader();
      key_reader.onload = function(evt){
        data.key = evt.target.result;
        self.submit_taskd(data);
      };
      key_reader.onerror = function(evt) {
        data.key = false;
        self.submit_taskd(data);
      };
      key_reader.onabort = function(evt) {
        data.key = false;
        self.submit_taskd(data);
      };
      var key_file = document.getElementById('id_key').files[0];
      if (key_file === undefined) {
        self.error_message("Please select a key");
      }
      key_reader.readAsBinaryString(key_file);

      // Load CA Certificate
      var ca_reader = new FileReader();
      ca_reader.onload = function(evt){
        data.ca = evt.target.result;
        self.submit_taskd(data);
      };
      ca_reader.onerror = function(evt) {
        data.ca = false;
        self.submit_taskd(data);
      };
      ca_reader.onabort = function(evt) {
        data.ca = false;
        self.submit_taskd(data);
      };
      var ca_file = document.getElementById('id_ca').files[0];
      if (ca_file === undefined) {
        self.error_message("Please select a CA Certificate");
      }
      ca_reader.readAsBinaryString(ca_file);
    }
  }
});

module.exports = controller;

},{}],7:[function(require,module,exports){
var controller = Ember.ObjectController.extend({
  needs: ['tasks'],
  priorities: [
    {short: '', long: '(none)'},
    {short: 'l', long: 'Low'},
    {short: 'm', long: 'Medium'},
    {short: 'h', long: 'High'},
  ],
  actions: {
    'save': function() {
      if (this.get('due')) {
        this.set('due', moment(this.get('due')).toDate());
      }
      var model = this.get('model');
      var self = this;
      model.save().then(function(){
        $('#new_task_form').foundation('reveal', 'close');
        Ember.run.next(self, function(){
          if (model.get('isDirty')) {
            model.save().then(function(){
              self.get('controllers.tasks').refresh();
              self.transitionToRoute('task', model);
            });
          } else {
            self.get('controllers.tasks').refresh();
            self.transitionToRoute('task', model);
          }
        });
      }, function(){
        alert("An error was encountered while saving your task.");
      });
    }
  }
});

module.exports = controller;

},{}],8:[function(require,module,exports){

App.ApplicationController = require("./application");
App.TaskController = require("./task");
App.TasksController = require("./tasks");
App.CompletedController = require("./completed");
App.CompletedTaskController = require("./completedTask");
App.ApiAccessController = require("./api_access");
App.SynchronizationController = require("./synchronization");
App.ConfigureController = require("./configure");
App.SmsController = require("./sms");
App.CreateTaskController = require("./create_task");

App.IndexController = Ember.Controller.extend({
  needs: ["application"],
  init: function(){
    var user = this.get('controllers.application').user;
    var configured = user.configured;
    var self = this;
    if (! user.logged_in) {
      self.transitionToRoute('about');
    } else {
      if (configured) {
        self.transitionToRoute('tasks');
      } else {
        $.ajax(
          {
            url: '/api/v1/task/autoconfigure/',
            dataType: 'json',
            statusCode: {
              200: function(){
                self.transitionToRoute('tasks');
              },
              404: function(){
                self.transitionToRoute('unconfigurable');
              },
              409: function(){
                self.transitionToRoute('configure');
              },
            }
          }
        );
      }
    }
  }
});

},{"./api_access":2,"./application":3,"./completed":4,"./completedTask":5,"./configure":6,"./create_task":7,"./sms":9,"./synchronization":10,"./task":11,"./tasks":12}],9:[function(require,module,exports){
module.exports=require(2)
},{}],10:[function(require,module,exports){
module.exports=require(2)
},{}],11:[function(require,module,exports){
var controller = Ember.ObjectController.extend({
  needs: ['tasks'],
  actions: {
    'complete': function(){
      var self = this;
      this.get('model').destroyRecord().then(function(){
        self.get('controllers.tasks').refresh();
        self.transitionToRoute('tasks');
      }, function(){
        alert("An error was encountered while marking this task completed.");
      });
    },
    'delete': function(){
      var url = this.store.adapterFor('task').buildURL('task', this.get('uuid')) + 'delete/';
      $.ajax({
        url: url,
        dataType: 'json',
        statusCode: {
          200: function(){
            self.get('model').unloadRecord();
            self.get('controllers.tasks').refresh();
            self.transitionToRoute('tasks');
          },
          501: function(){
            alert("Deleting tasks is currently unimplemented");
          }
        }
      });
    }
  }
});

module.exports = controller;

},{}],12:[function(require,module,exports){
var controller = Ember.ArrayController.extend({
  sortProperties: ['urgency'],
  sortAscending: false,
  refresh: function(){
    this.get('content').update();
  },
  pendingTasks: function() {
    var result = this.get('model').filterProperty('status', 'pending');

    var sortedResult = Em.ArrayProxy.createWithMixins(
      Ember.SortableMixin,
      {
        content:result,
        sortProperties: this.sortProperties,
        sortAscending: false
      }
    );
    return sortedResult;
  }.property('model.@each.status')
});

module.exports = controller;

},{}],13:[function(require,module,exports){

Ember.Handlebars.helper('comma_to_list', function(item, options){
  return item.split(',');
});

Ember.Handlebars.helper('propercase', function(project_name, options) {
  if (project_name) {
    var properCase = function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    };
    return project_name.replace('_', ' ').replace(/\w\S*/g, properCase);
  }
});

Ember.Handlebars.helper('calendar', function(date, options) {
  if (date) {
    return new Handlebars.SafeString('<span class="calendar date" title="' + moment(date).format('LLLL') + '">' + moment(date).calendar() + "</span>");
  }
});

},{}],14:[function(require,module,exports){
window.App = require('./app');

require("./controllers");
require("./models");
require("./routes");
require("./views");
require("./helpers");

},{"./app":1,"./controllers":8,"./helpers":13,"./models":15,"./routes":22,"./views":28}],15:[function(require,module,exports){

App.User = require("./user.js");
App.Task = require("./task.js");

App.DirectTransform = DS.Transform.extend({
  serialize: function(value) {
    return value;
  },
  deserialize: function(value) {
    return value;
  }
});

},{"./task.js":16,"./user.js":17}],16:[function(require,module,exports){
var model = DS.Model.extend({
  annotations: DS.attr(),
  tags: DS.attr(),
  description: DS.attr('string'),
  due: DS.attr('date'),
  entry: DS.attr('date'),
  modified: DS.attr('date'),
  priority: DS.attr('string'),
  resource_uri: DS.attr('string'),
  start: DS.attr('date'),
  wait: DS.attr('date'),
  scheduled: DS.attr('date'),
  'status': DS.attr('string'),
  urgency: DS.attr('number'),
  uuid: DS.attr('string'),
  depends: DS.attr('string'),
  project: DS.attr('string'),
  imask: DS.attr('number'),

  editable: function(){
    if (this.get('status') == 'pending') {
      return true;
    }
    return false;
  }.property('status'),

  icon: function() {
    if (this.get('status') == 'completed') {
      return 'fa-check-circle-o';
    } else if (this.get('start')) {
      return 'fa-asterisk';
    } else if (this.get('due')) {
      return 'fa-clock-o';
    } else {
      return 'fa-circle-o';
    }
  }.property('status', 'start', 'due'),

  taskwarrior_class: function() {
    if (this.get('start')) {
      return 'active';
    } else if (moment(this.get('due')).isBefore(moment())) {
      return 'overdue';
    } else if (moment().add('hours', 24).isAfter(this.get('due'))) {
      return 'due__today';
    } else if (moment().add('days', 7).isAfter(this.get('due'))) {
      return 'due';
    } else if (this.get('imask')) {
      return 'recurring';
    } else if (this.get('priority') == 'H') {
      return 'pri__H';
    } else if (this.get('priority') == 'M') {
      return 'pri__M';
    } else if (this.get('priority') == 'L') {
      return 'pri__L';
    } else if (this.get('tags')) {
      return 'tagged';
    }
  }.property('status', 'urgency', 'start', 'due'),

  processed_annotations: function() {
    var value = this.get('annotations');
    if (value) {
      for (var i = 0; i < value.length; i++) {
        value[i] = {
          entry: new Date(Ember.Date.parse(value[i].entry)),
          description: value[i].description
        };
      }
    } else {
      return [];
    }
    return value;
  }.property('annotations'),

  dependent_tickets: function(){
    var value = this.get('depends');
    var values = [];
    if (value) {
      var ticket_ids = value.split(',');
      var add_value_to_values = function(value) {
        values[values.length] = value;
      };
      for (var i = 0; i < ticket_ids.length; i++) {
        this.store.find('task', ticket_ids[i]).then(add_value_to_values);
      }
      return values;
    } else {
      return [];
    }
  }.property('depends'),

  as_json: function() {
    return JSON.stringify(this.store.serialize(this));
  }.property()
});

module.exports = model;

},{}],17:[function(require,module,exports){
var model = DS.Model.extend({
  logged_in: DS.attr('boolean'),
  uid: DS.attr('string'),
  username: DS.attr('string'),
  name: DS.attr('string'),
  email: DS.attr('string'),
  configured: DS.attr('boolean'),
  taskd_credentials: DS.attr('string'),
  taskd_server: DS.attr('string'),
  api_key: DS.attr('string')
});

module.exports = model;

},{}],18:[function(require,module,exports){
App.Router.map(function(){
  this.route("login", {path: "/login"});
  this.route("about", {path: "/about"});
  this.resource("tasks", function(){
    this.resource("task", {path: "/:uuid"});
  });
  this.resource("completed", function(){
    this.resource("completedTask", {path: "/:uuid"});
  });
  this.route("unconfigurable", {path: "/no-tasks"});
  this.route("api_access", {path: "/api-access"});
  this.route("synchronization", {path: "/synchronization"});
  this.route("configure", {path: "/configure"});
  this.route("getting_started", {path: "/getting-started"});
  this.route("sms", {path: "/sms"});
});

App.Router.reopen({
  location: 'history'
});

},{}],19:[function(require,module,exports){
var route = Ember.Route.extend({
  actions: {
    'create_task': function() {
      this.controllerFor('create_task').set(
        'model',
        this.store.createRecord('task', {})
      );
      var rendered = this.render(
        'create_task',
        {
          'into': 'application',
          'outlet': 'modal',
        }
      );
      Ember.run.next(null, function(){
        $(document).foundation();
        $("#new_task_form").foundation('reveal', 'open');
      });
      return rendered;
    }
  }
});

module.exports = route;

},{}],20:[function(require,module,exports){
var route = Ember.Route.extend({
  model: function(){
    return this.store.findQuery('task', {completed: 1, order_by: '-modified'});
  }
});

module.exports = route;

},{}],21:[function(require,module,exports){
var route = Ember.Route.extend({
  model: function(params) {
    return this.store.find('task', params.uuid);
  }
});

module.exports = route;

},{}],22:[function(require,module,exports){

App.IndexRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('index');
    this.render('navigation', {outlet: 'navigation'});
  }
});
App.TasksRoute = require("./tasks");
App.TaskRoute = require("./task");
App.CompletedRoute = require("./completed");
App.CompletedTaskRoute = require("./completedTask");
App.ApplicationRoute = require("./application");

},{"./application":19,"./completed":20,"./completedTask":21,"./task":23,"./tasks":24}],23:[function(require,module,exports){
var route = Ember.Route.extend({
  model: function(params) {
     return this.store.find('task', params.uuid);
  },
  actions: {
    'edit': function(){
      this.controllerFor('create_task').set(
        'model',
        this.controllerFor('task').get('model')
      );
      var rendered = this.render(
        'create_task',
        {
          'into': 'application',
          'outlet': 'modal',
        }
      );
      Ember.run.next(null, function(){
        $(document).foundation();
        $("#new_task_form").foundation('reveal', 'open');
      });
      return rendered;
    },
  }
});

module.exports = route;

},{}],24:[function(require,module,exports){
var route = Ember.Route.extend({
  model: function() {
    return this.store.find('task');
  },
  afterModel: function(tasks, transition) {
    if (tasks.get('length') === 0) {
      this.transitionTo('getting_started');
    } else if (transition.targetName == "tasks.index") {
      this.transitionTo('task', tasks.get('firstObject'));
    }
  }
});

module.exports = route;

},{}],25:[function(require,module,exports){
var view = Ember.View.extend({
});

module.exports = view;

},{}],26:[function(require,module,exports){
var view = Ember.View.extend({
  templateName: 'tasks',
  name: 'completed'
});

module.exports = view;

},{}],27:[function(require,module,exports){
var view = Ember.View.extend({
  templateName: 'task',
  name: 'completedTask'
});

module.exports = view;

},{}],28:[function(require,module,exports){

App.CompletedView = require("./completed");
App.CompletedTaskView = require("./completedTask");
App.RefreshView = require("./refresh");
App.ApplicationView = require("./application");

},{"./application":25,"./completed":26,"./completedTask":27,"./refresh":29}],29:[function(require,module,exports){
var view = Ember.View.extend({
  didInsertElement: function(){
    this.controller.transitionToRoute('tasks');
  }
});

module.exports = view;

},{}]},{},[1,13,14,18])