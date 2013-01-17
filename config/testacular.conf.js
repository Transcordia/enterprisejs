basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'src/main/webapp/lib/angular/angular.js',
  'src/main/webapp/lib/angular/angular-*.js',
  'test/lib/angular/angular-mocks.js',
  'src/main/webapp/js/**/*.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
