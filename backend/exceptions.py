"""
예외 처리 모듈

커스텀 예외 클래스와 전역 예외 핸들러를 정의합니다.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Union


# ===== 커스텀 예외 클래스 =====

class BluemeException(Exception):
    """
    Blueme 애플리케이션의 기본 예외 클래스
    
    Attributes:
        message: 예외 메시지
        status_code: HTTP 상태 코드
    """
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class PromptNotFoundError(BluemeException):
    """프롬프트를 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, prompt_id: int = None):
        message = f"프롬프트를 찾을 수 없습니다"
        if prompt_id:
            message = f"프롬프트를 찾을 수 없습니다 (ID: {prompt_id})"
        super().__init__(message, status_code=404)


class FolderNotFoundError(BluemeException):
    """폴더를 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, folder_id: int = None):
        message = f"폴더를 찾을 수 없습니다"
        if folder_id:
            message = f"폴더를 찾을 수 없습니다 (ID: {folder_id})"
        super().__init__(message, status_code=404)


class FolderNameDuplicateError(BluemeException):
    """중복된 폴더 이름일 때 발생하는 예외"""
    def __init__(self, folder_name: str = None):
        message = "이미 존재하는 폴더 이름입니다"
        if folder_name:
            message = f"이미 존재하는 폴더 이름입니다: {folder_name}"
        super().__init__(message, status_code=400)


class AutoTextDuplicateError(BluemeException):
    """중복된 자동변환 텍스트 트리거일 때 발생하는 예외"""
    def __init__(self, trigger_text: str = None):
        message = "이미 사용 중인 자동변환 텍스트입니다"
        if trigger_text:
            message = f"이미 사용 중인 자동변환 텍스트입니다: {trigger_text}"
        super().__init__(message, status_code=400)


class DatabaseError(BluemeException):
    """데이터베이스 작업 중 발생하는 예외"""
    def __init__(self, message: str = "데이터베이스 오류가 발생했습니다"):
        super().__init__(message, status_code=500)


# ===== 전역 예외 핸들러 =====

async def blueme_exception_handler(request: Request, exc: BluemeException) -> JSONResponse:
    """
    Blueme 커스텀 예외 핸들러
    
    Args:
        request: FastAPI 요청 객체
        exc: BluemeException 또는 하위 클래스
    
    Returns:
        JSONResponse: 에러 응답
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url.path)
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    요청 유효성 검증 실패 핸들러
    
    Args:
        request: FastAPI 요청 객체
        exc: RequestValidationError
    
    Returns:
        JSONResponse: 에러 응답
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "요청 데이터가 올바르지 않습니다",
            "details": exc.errors(),
            "path": str(request.url.path)
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    일반 예외 핸들러 (예상하지 못한 예외 처리)
    
    Args:
        request: FastAPI 요청 객체
        exc: Exception
    
    Returns:
        JSONResponse: 에러 응답
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "서버 내부 오류가 발생했습니다",
            "path": str(request.url.path)
        }
    )


def register_exception_handlers(app: FastAPI) -> None:
    """
    FastAPI 앱에 예외 핸들러를 등록합니다.
    
    Args:
        app: FastAPI 애플리케이션 인스턴스
    """
    # 커스텀 예외 핸들러
    app.add_exception_handler(BluemeException, blueme_exception_handler)
    
    # 유효성 검증 예외 핸들러
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # 일반 예외 핸들러
    app.add_exception_handler(Exception, general_exception_handler)

