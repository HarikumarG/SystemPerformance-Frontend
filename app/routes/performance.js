import Route from '@ember/routing/route';

export default class PerformanceRoute extends Route {
    beforeModel(transition) {
        if(transition.from == null || transition.from["name"] != "signin" || transition.urlMethod != "update") {
            this.transitionTo('signin');
        }
    }
}