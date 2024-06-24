# [1.0.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.9.0...v1.0.0) (2024-06-24)



# [0.9.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.8.1...v0.9.0) (2023-02-27)


### Bug Fixes

* update imports ([d263c8f](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/d263c8f24cdca9d234025ed7c23ba0176ae58543))



## [0.8.1](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.8.0...v0.8.1) (2023-01-07)


### Bug Fixes

* terminated session metrics are not deleted ([d977b29](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/d977b2987c71f95c5bae5eeadc9432e68912bba5))



# [0.8.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.7.0...v0.8.0) (2023-01-06)


### Features

* add single session metric, keep metrics in memory until next scrape ([e51cda1](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/e51cda14f07837c9328d87937d9ee557ce6ac929))



# [0.7.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.6.0...v0.7.0) (2022-07-11)


### Features

* make compatible with latest open telemetry deps ([5d6a543](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/5d6a543bfcfd7336a1c18018fbc18cab974955b5))



# [0.6.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.5.0...v0.6.0) (2022-01-04)


### Features

* use @opentelemetry/sdw-metrics-base module ([a75a4a9](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/a75a4a964b612bda355f86e846e09f2d3e366bed))



# [0.5.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.4.0...v0.5.0) (2021-07-18)


### Features

* add array that expires contents after given time ([9f5a6b4](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/9f5a6b4e89572df90b79b6036f9138f47e75aef3))
* add up metric to indicate exporter state ([ac00eb7](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/ac00eb75ce6c162f6c552b1a621897a1edf9063c))
* make metrics retention configurable ([7dc35d8](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/7dc35d89f2c7017205e7ecef012429ba14e3c40d))
* store login sessions in expiring array ([ab49f69](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/ab49f69ab979e4020aa91ea1dbed9007e2037fbd))



# [0.4.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.3.0...v0.4.0) (2021-07-17)


### Features

* reset metric after users have logged out ([933faee](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/933faeee0e7f6f838df7c0d67187a04e66eacb11))



# [0.3.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.2.0...v0.3.0) (2021-07-17)


### Bug Fixes

* typo in EXPORTER_CHECK_INTERVAL_MILLIS ([9e3a217](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/9e3a217fce7369a32a5e774c684eb9ebffe2c220))


### Features

* add command line flag parser ([0473833](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/0473833be65d49eae74d97de36e968567724f5b2))
* exit with status 0 if help was requested ([36f41f1](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/36f41f1acf6d9709ff8c0f2a554b2e38c00c4e30))
* respect commandline flags also ([f61187b](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/f61187b77e0544ea5c26d999a439f1532d6d1b01))
* use 9839 as default port ([b2e9e19](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/b2e9e199c978aa907e50ab67a481bb5c27eddb47))
* use w -i to make sure ip is returned ([b74fd49](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/b74fd4978fac68bbbda6081b60bfde19a453552f))



# [0.2.0](https://github.com/stfsy/prometheus-what-active-users-exporter/compare/v0.1.0...v0.2.0) (2021-07-17)


### Features

* add prometheus exporter server ([b3887d6](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/b3887d604ea5d76a9e6169a64a08f81185bd4a6f))
* add w command output parser ([9e1e372](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/9e1e372b6834d3d254ed601302712f60915fc404))
* add w exec command wrapper ([8c16651](https://github.com/stfsy/prometheus-what-active-users-exporter/commit/8c16651533c606d9a1b6718b079e189bd5b0828b))



# 0.1.0 (2021-07-16)



