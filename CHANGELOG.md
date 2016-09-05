# 1.0.4 (2016-09-05)
  - Remove field 'join' when make an association to avoid error

# 1.0.3 (2016-08-31)
  - Add more logs into connect standard process

# 1.0.2 (2016-04-04)
  - update package.json

# 1.0.1 (2016-02-03)
  - bug fix : add bind(this) on Active directory strategy

# 1.0.0(2015-12-30)
  - Use bind() and apply() instead of saving context
  - add test on endPoint to check if session is correct
  - package update

# 0.2.2(2015-12-22)
  - Bug fixe : change test to determine if it's an join request

# 0.2.1(2015-12-21)
  - Bug fixe : use index of array for strategies Standard and active-directory because multiple strategies can be configured

# 0.2.0(2015-11-19)
  - update name of function :
    - enableStandard -> addStandard
    - enableActiveDirectory -> addStandard
    - enableFacebook -> addFacebook
    - enableTwitter -> addTwitter
    - enableGoogle -> addGoogle

# 0.1.2 (2015-11-19)

  - update url Redirect '/auth/success/join' in '/auth/join/success' and '/auth/fail/join' in '/auth/join/fail'

# 0.1.1 (2015-11-19)

  - Redirect when connect fail for standard ou ad instead of send an http response
  - add query string value for the success join that contains the name of provider

# 0.1.0 (2015-11-18)

  - Import middleware from ecrm-api
