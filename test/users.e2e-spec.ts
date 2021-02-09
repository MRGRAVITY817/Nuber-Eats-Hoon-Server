import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import * as request from 'supertest';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const TEST_USER = {
  email: 'mrgravity817@gmail.com',
  password: '817917',
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  // After all the test, we should drop all the database
  // and close the system
  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  // E2E testing "createAccount()"
  describe('createAccount', () => {
    // Testing creating account
    it('should create account', () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email: "${TEST_USER.email}"
              password: "${TEST_USER.password}"
              role: Owner
            }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    // Testing failure if there's already same account
    it('should fail if account already exists', () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email: "${TEST_USER.email}"
              password: "${TEST_USER.password}"
              role:Owner
            }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual(expect.any(String));
        });
    });
  });

  // E2E Testing "login()"
  describe('login', () => {
    // Testing whether it returns token after logging in
    it('should get a token after login', () => {
      return publicTest(`
        mutation {
          login(input: {
            email: "${TEST_USER.email}"
            password: "${TEST_USER.password}"
          }) {
            ok
            error
            token
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    // Testing login failure with wrong password
    it('should not login with wrong password', () => {
      return publicTest(`
        mutation {
          login(input: {
            email: "${TEST_USER.email}"
            password: "wrongPassword"
          }) {
            ok
            error
            token
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong Password!');
          expect(login.token).toBe(null);
        });
    });
  });

  // E2E Testing "userProfile()"
  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      // Get first element of user array
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    // Testing getting user profile
    it('should show a user profile', () => {
      return privateTest(`
        query {
          userProfile(userId: ${userId}) {
            ok
            error
            user {
              id
            }
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });
    // Testing if failure occurs for giving invalid id
    it('should not find profile', () => {
      return privateTest(`
        query {
          userProfile(userId: 1004) {
            ok
            error
            user {
              id
            }
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  // E2E Testing "me()"
  describe('me', () => {
    // Testing finding user's profile
    it('should find my profile', () => {
      return privateTest(`
        query {
          me {
            email
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(TEST_USER.email);
        });
    });
    // Testing how it blocks resource retrieval for logged out users
    it('should not allow logged out user', () => {
      return publicTest(`
        query {
          me {
            email
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  // E2E Testing 'editProfile()'
  describe('editProfile', () => {
    const NEW_EMAIL = '';
    // Testing if it changes email
    it('should change email', () => {
      return privateTest(`
        mutation {
          editProfile(input:{
          email:"${NEW_EMAIL}"}){
            ok
            error
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    // Testing whether the email has changed as it's intended
    it('should have new email', () => {
      return privateTest(`
        query {
          me { email }   
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(TEST_USER.email);
        });
    });
  });

  // E2E Testing 'verifyEmail()'
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });
    // Testing verification
    it('should verify email', () => {
      return publicTest(`
        mutation{
          verifyEmail(input: {
            code: "${verificationCode}"
          }){
            ok
            error
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    // Testing wrong verification check
    it('should give a fail on wrong verification code', () => {
      return publicTest(`
        mutation{
          verifyEmail(input: {
            code: "verificationNoT"
          }){
            ok
            error
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
