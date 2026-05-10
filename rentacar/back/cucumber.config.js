module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/hooks.js',
      'features/support/world.js',
      'features/step_definitions/**/*.steps.js'
    ],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    parallel: 1,
    timeout: 30000
  }
};
