var route = Ember.Route.extend({
  actions: {
    'create_task': function() {
      this.controllerFor('createTaskModal').set(
        'model',
        this.store.createRecord('task', {})
      );
      var rendered = this.render(
        'createTaskModal',
        {
          'into': 'application',
          'outlet': 'modal',
        }
      );
      var displayModal = function(){
        $(document).foundation();
        $("#new_task_form").foundation('reveal', 'open');
        setTimeout(function(){$("input[name=description]").focus();}, 500);
      };
      Ember.run.scheduleOnce('afterRender', this, displayModal);
      return true;
    }
  }
});

module.exports = route;
