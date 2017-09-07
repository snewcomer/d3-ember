import Ember from 'ember';

export default Ember.Controller.extend({
  authorData: [
    { label: 'Wat', count: 15 },
    { label: 'Bar', count: 3 },
    { label: 'foo', count: 25 },
    { label: 'scrat', count: 52 },
  ],
  queryParams: ['selectedAuthor', 'selectedComment'],
  selectedAuthor: null,
  selectedComment: null,

  actions: {
    toggleBar(property, label) {
      let newValue = this.get(property) === label ? null : label;
      this.set(property, newValue); 
    }
  }
});
