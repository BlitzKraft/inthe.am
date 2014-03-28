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
  blocks: DS.attr('string'),
  project: DS.attr('string'),
  imask: DS.attr('number'),
  udas: DS.attr(),

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
    } else if (this.get('is_blocked')) {
      return 'blocked';
    } else if (this.get('is_blocking')) {
      return 'blocking';
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
  }.property('status', 'urgency', 'start', 'due', 'depends'),

  is_blocked: function() {
    // This doesn't work yet because we do not resolve
    // dependent/blocks via a promise, so the list will always be
    // empty until the requests complete.  Maybe we should calculate
    // this in the API?

    //return this.get('dependent_tickets').any(
    //  function(item, idx, enumerable) {
    //    if (item.get('status') == 'pending') {
    //      return true;
    //    }
    //    return false;
    //  }
    //);
    return false;
  }.property('dependent_tickets'),

  is_blocking: function() {
    return false;
  }.property('blocks'),

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

  processed_udas: function() {
    var value = [];
    for(var v in this.get('udas')) {
      value.push(this.get('udas')[v]);
    }
    return value;
  }.property('udas'),

  _string_field_to_data: function(field_name) {
    var value = this.get(field_name);
    var values = [];
    if (value) {
      var ticket_ids = value.split(',');
      var add_value_to_values = function(value) {
        values.pushObject(value);
      };
      for (var i = 0; i < ticket_ids.length; i++) {
        this.store.find('task', ticket_ids[i]).then(add_value_to_values);
      }
      return values;
    } else {
      return [];
    }
  },

  dependent_tickets: function(){
    return this._string_field_to_data('depends');
  }.property('depends'),

  blocked_tickets: function(){
    return this._string_field_to_data('blocks');
  }.property('blocks'),

  as_json: function() {
    return JSON.stringify(this.store.serialize(this));
  }.property()
});

module.exports = model;
